import fs from "node:fs";
import path from "node:path";
import type { ASTNode } from "@solidity-parser/parser";
import parser from "@solidity-parser/parser";
import { glob } from "glob";

interface PragmaDirective {
	type: string;
	name: string;
	value: string;
}

interface TypeName {
	type: string;
	name?: string;
	namePath?: string | { name: string } | string[];
	baseTypeName?: TypeName;
	length?: string;
	keyType?: TypeName;
	valueType?: TypeName;
}

interface Parameter {
	type: string;
	typeName: TypeName;
	name?: string;
	storageLocation?: string;
	indexed?: boolean;
}

interface ParameterList {
	type: string;
	parameters?: Parameter[];
}

interface FunctionDefinition {
	type: string;
	name?: string;
	parameters?: Parameter[];
	returnParameters?: Parameter[];
	stateMutability?: string;
	visibility?: string;
}

interface EventDefinition {
	type: string;
	name: string;
	parameters?: ParameterList;
}

interface StructMember {
	type: string;
	typeName: TypeName;
	name: string;
}

interface StructDefinition {
	type: string;
	name: string;
	members?: StructMember[];
}

interface ErrorDefinition {
	type: string;
	name: string;
	parameters?: Parameter[];
}

interface VariableDeclaration {
	type: string;
	visibility?: string;
	typeName: TypeName;
	name: string;
}

interface StateVariableDeclaration {
	type: string;
	variables?: VariableDeclaration[];
}

interface ContractDefinition {
	type: string;
	name: string;
	kind: string;
	subNodes?: (
		| StructDefinition
		| FunctionDefinition
		| EventDefinition
		| ErrorDefinition
		| VariableDeclaration
		| StateVariableDeclaration
	)[];
}

const SRC_DIR = path.resolve(process.cwd(), "./src");
const OUT_DIR = path.join(SRC_DIR, "interfaces");
const SPDX_HEADER = "// SPDX-License-Identifier: MIT"; // change latr

function prepareOutDir() {
	if (fs.existsSync(OUT_DIR)) {
		const files = fs.readdirSync(OUT_DIR);
		for (const file of files) {
			const filePath = path.join(OUT_DIR, file);
			if (fs.statSync(filePath).isFile()) {
				fs.unlinkSync(filePath);
			}
		}
	} else {
		fs.mkdirSync(OUT_DIR, { recursive: true });
	}
}

function extractPragmaAndVersion(fileText: string) {
	try {
		const ast = parser.parse(fileText, { tolerant: true });
		let pragma = "";
		parser.visit(ast, {
			PragmaDirective(node: PragmaDirective) {
				if (!pragma && node.name === "solidity") {
					pragma = `pragma solidity ${node.value};`;
				}
			},
		});
		return pragma;
	} catch (_) {
		return "";
	}
}

function typeNameToString(node: TypeName): string {
	if (!node) return "";
	switch (node.type) {
		case "ElementaryTypeName":
			return node.name ?? "UnknownType";
		case "UserDefinedTypeName":
			if (typeof node.namePath === "string") {
				return node.namePath;
			} else if (node.namePath && (node.namePath as { name: string }).name) {
				return (node.namePath as { name: string }).name;
			} else if (Array.isArray(node.namePath)) {
				return node.namePath
					.map((p: string | { name?: string }) =>
						typeof p === "string" ? p : (p.name ?? p),
					)
					.join(".");
			}
			return node.name ?? "UnknownType";
		case "ArrayTypeName":
			return `${node.baseTypeName ? typeNameToString(node.baseTypeName) : "UnknownType"}${
				node.length ? `[${node.length}]` : "[]"
			}`;
		case "Mapping":
			return `mapping(${node.keyType ? typeNameToString(node.keyType) : "UnknownType"} => ${
				node.valueType ? typeNameToString(node.valueType) : "UnknownType"
			})`;
		case "FunctionTypeName":
			return "function";
		default:
			return node.name ?? "UnknownType";
	}
}

function isUserDefinedContractType(
	typeName: string,
	structNames: Set<string>,
): boolean {
	if (!typeName || typeName.length === 0) return false;
	if (structNames.has(typeName)) return false;
	if (
		typeName === "address" ||
		typeName === "bool" ||
		typeName === "string" ||
		typeName === "bytes"
	)
		return false;
	if (/^u?int\d*$/.test(typeName) || /^bytes\d+$/.test(typeName)) return false;
	// If it starts with uppercase and isn't a known struct, it must be a contract type
	if (typeName[0] >= "A" && typeName[0] <= "Z") return true;
	return false;
}

function needsDataLocation(typeName: string): boolean {
	if (typeName === "string" || typeName === "bytes") return true;
	if (typeName.endsWith("[]")) return true;
	if (typeName.startsWith("mapping(")) return true;
	// Structs: starts with uppercase, not value types
	if (
		typeName[0] === typeName[0].toUpperCase() &&
		typeName !== "address" &&
		!typeName.startsWith("I") &&
		!typeName.startsWith("Uint") &&
		!typeName.startsWith("Int") &&
		!typeName.startsWith("Bytes")
	)
		return true;
	return false;
}

function extractMappingParams(
	typeName: TypeName,
	paramNames: string[] = [],
): { params: string[]; returnType: string } {
	if (typeName.type === "Mapping") {
		const keyType = typeName.keyType
			? typeNameToString(typeName.keyType)
			: "UnknownType";
		const paramName = paramNames.length > 0 ? paramNames[0] : "key";
		const keyParam = needsDataLocation(keyType)
			? `${keyType} calldata ${paramName}`
			: `${keyType} ${paramName}`;

		const nextParamNames =
			paramNames.length > 1
				? paramNames.slice(1)
				: [`key${paramNames.length + 1}`];
		const nested = typeName.valueType
			? extractMappingParams(typeName.valueType, nextParamNames)
			: { params: [], returnType: "UnknownType" };

		return {
			params: [keyParam, ...nested.params],
			returnType: nested.returnType,
		};
	} else {
		return {
			params: [],
			returnType: typeNameToString(typeName),
		};
	}
}

function paramListToString(paramList: Parameter[] | undefined): string {
	if (!paramList || !Array.isArray(paramList)) return "";
	return paramList
		.map((p: Parameter) => {
			const t = typeNameToString(p.typeName);

			const name = p.name || "";

			const storageLocation = p.storageLocation || "";
			const locationStr =
				storageLocation && storageLocation !== "default"
					? ` ${storageLocation}`
					: "";
			return name ? `${t}${locationStr} ${name}` : `${t}${locationStr}`;
		})
		.join(", ");
}

function returnsToString(
	paramList: Parameter[] | undefined,
	structNames?: Set<string>,
): string {
	if (!paramList || !Array.isArray(paramList) || paramList.length === 0)
		return "";
	const s = paramList
		.map((p: Parameter) => {
			let t = typeNameToString(p.typeName);
			if (structNames && isUserDefinedContractType(t, structNames)) {
				t = "address";
			}
			const name = p.name || "";

			const storageLocation = p.storageLocation || "";
			const locationStr =
				storageLocation && storageLocation !== "default"
					? ` ${storageLocation}`
					: "";
			return name ? `${t}${locationStr} ${name}` : `${t}${locationStr}`;
		})
		.join(", ");
	return s.includes(",") ? `(${s})` : s;
}

function functionToSignature(
	node: FunctionDefinition,
	structNames?: Set<string>,
): string {
	const name = node.name || "";

	if (
		!name ||
		name === "constructor" ||
		name === "receive" ||
		name === "fallback"
	)
		return "";

	const params = paramListToString(node.parameters);
	const returns = node.returnParameters
		? returnsToString(node.returnParameters, structNames)
		: "";
	const stateMut =
		node.stateMutability && node.stateMutability !== "nonpayable"
			? node.stateMutability
			: "";

	const visibility = node.visibility || "";
	if (visibility === "private" || visibility === "internal") return "";

	const parts = [];
	parts.push(`function ${name}(${params})`);
	parts.push("external");
	if (stateMut) parts.push(stateMut);
	if (returns) parts.push(`returns (${returns})`);

	return `${parts.join(" ")};`;
}

function eventToSignature(node: EventDefinition): string {
	const name = node.name;
	const params = node.parameters?.parameters
		? node.parameters.parameters
				.map((p: Parameter) => {
					const type = typeNameToString(p.typeName);
					const indexed = p.indexed ? " indexed" : "";
					const pname = p.name ? ` ${p.name}` : "";
					return `${type}${indexed}${pname}`;
				})
				.join(", ")
		: "";
	return `event ${name}(${params});`;
}

function structToDefinition(node: StructDefinition): string {
	const name = node.name;
	const members = node.members
		? node.members
				.map((member: StructMember) => {
					const type = typeNameToString(member.typeName);
					const memberName = member.name;
					return `        ${type} ${memberName};`;
				})
				.join("\n")
		: "";

	return `    struct ${name} {\n${members}\n    }`;
}

function errorToSignature(node: ErrorDefinition): string {
	const name = node.name;
	const params = node.parameters ? paramListToString(node.parameters) : "";
	return `error ${name}(${params});`;
}

function extractImmutableVariables(
	fileText: string,
): Map<string, { varName: string; type: string }> {
	const immutableVars = new Map<string, { varName: string; type: string }>();
	const lines = fileText.split("\n");

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.includes("public immutable")) {
			const match = trimmed.match(/(\w+)\s+public\s+immutable\s+(\w+);/);
			if (match) {
				const [, type, varName] = match;
				immutableVars.set(type, { varName, type });
			}
		}
	}

	return immutableVars;
}

function generateInterfaceForContract(
	contractNode: ContractDefinition,
	pragma: string | null,
	srcFilePath: string,
	sourceText: string,
) {
	const name = contractNode.name;
	const ifaceName = `I${name}`;
	const outFilename = path.join(OUT_DIR, `I${name}.sol`);

	const immutableVars = extractImmutableVariables(sourceText);

	const structNames = new Set<string>();
	if (contractNode.subNodes) {
		for (const sub of contractNode.subNodes) {
			if (sub.type === "StructDefinition") {
				structNames.add((sub as StructDefinition).name);
			}
		}
	}

	const lines: string[] = [];
	lines.push(SPDX_HEADER);
	if (pragma) lines.push(pragma);
	lines.push("");

	const rel = path.relative(process.cwd(), srcFilePath);
	lines.push(
		`// Auto-generated from ${rel} — DO NOT EDIT (regenerate with the script only)`,
	);
	lines.push("");
	lines.push(`interface ${ifaceName} {`);

	if (contractNode.subNodes && Array.isArray(contractNode.subNodes)) {
		for (const sub of contractNode.subNodes) {
			if (sub.type === "StructDefinition") {
				const structDef = structToDefinition(sub as StructDefinition);
				lines.push(structDef);
				lines.push("");
			} else if (sub.type === "FunctionDefinition") {
				const sig = functionToSignature(sub as FunctionDefinition, structNames);
				if (sig) lines.push(`    ${sig}`);
			} else if (sub.type === "EventDefinition") {
				const sig = eventToSignature(sub as EventDefinition);
				lines.push(`    ${sig}`);
			} else if (sub.type === "ErrorDefinition") {
				const sig = errorToSignature(sub as ErrorDefinition);
				lines.push(`    ${sig}`);
			} else if (sub.type === "VariableDeclaration") {
				const varDecl = sub as VariableDeclaration;
				if (varDecl.visibility === "public") {
					const varType = typeNameToString(varDecl.typeName);
					const varName = varDecl.name;

					let params = "";
					let returnType = varType;

					if (varDecl.typeName.type === "ArrayTypeName") {
						params = `uint256 index`;
						returnType = varDecl.typeName.baseTypeName
							? typeNameToString(varDecl.typeName.baseTypeName)
							: "UnknownType";
					} else if (varDecl.typeName.type === "Mapping") {
						const mappingInfo = extractMappingParams(varDecl.typeName);
						params = mappingInfo.params.join(", ");
						returnType = mappingInfo.returnType;
					}

					if (isUserDefinedContractType(returnType, structNames)) {
						returnType = "address";
					}

					const returnLocation = needsDataLocation(returnType) ? ` memory` : "";
					const getterSig = `function ${varName}(${params}) external view returns (${returnType}${returnLocation});`;
					lines.push(`    ${getterSig}`);
				}
			} else if (sub.type === "StateVariableDeclaration") {
				const stateVarDecl = sub as StateVariableDeclaration;
				if (stateVarDecl.variables && Array.isArray(stateVarDecl.variables)) {
					for (const variable of stateVarDecl.variables) {
						if (variable.visibility === "public") {
							const varType = typeNameToString(variable.typeName);
							let varName = variable.name;

							if (varName === "immutable") {
								const immutableInfo = immutableVars.get(varType);
								if (immutableInfo) {
									varName = immutableInfo.varName;
								}
							}

							let params = "";
							let returnType = varType;

							if (variable.typeName.type === "ArrayTypeName") {
								params = `uint256 index`;
								returnType = variable.typeName.baseTypeName
									? typeNameToString(variable.typeName.baseTypeName)
									: "UnknownType";
							} else if (variable.typeName.type === "Mapping") {
								const mappingInfo = extractMappingParams(variable.typeName);
								params = mappingInfo.params.join(", ");
								returnType = mappingInfo.returnType;
							}

							if (isUserDefinedContractType(returnType, structNames)) {
								returnType = "address";
							}

							const returnLocation = needsDataLocation(returnType)
								? ` memory`
								: "";
							const getterSig = `function ${varName}(${params}) external view returns (${returnType}${returnLocation});`;
							lines.push(`    ${getterSig}`);
						}
					}
				}
			}
		}
	}

	lines.push("}");
	lines.push("");

	fs.writeFileSync(outFilename, lines.join("\n"), { encoding: "utf8" });
	console.log(`Wrote ${path.relative(process.cwd(), outFilename)}`);
}

function processFile(filePath: string) {
	const text = fs.readFileSync(filePath, "utf8");
	const pragma = extractPragmaAndVersion(text);
	let ast: ASTNode;
	try {
		ast = parser.parse(text, { tolerant: true, loc: false, range: false });
	} catch (err) {
		console.error(`Failed to parse ${filePath}:`, err);
		return;
	}

	parser.visit(ast, {
		ContractDefinition(node: ContractDefinition) {
			if (node.kind === "contract") {
				generateInterfaceForContract(node, pragma, filePath, text);
			}
		},
	});
}

function main() {
	prepareOutDir();
	const pattern = path.join(SRC_DIR, "**/*.sol");
	const files = glob.sync(pattern, {
		nodir: true,
		ignore: [path.join(OUT_DIR, "**/*")],
	});

	if (files.length === 0) {
		console.log("No solidity files found under src/");
		return;
	}

	for (const f of files) {
		processFile(f);
	}
	console.log("Done.");
}

main();
