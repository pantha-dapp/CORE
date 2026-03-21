export const definitions = {
	"0x221": {
		PanthaOrchestrator: {
			address: "0xa80b731e8b3ba357df7a97248b3630e8f66f6aea",
			abi: [
				{
					inputs: [
						{
							internalType: "contract IERC20PermitToken",
							name: "panthaToken_",
							type: "address",
						},
					],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "InvalidRecipient",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidServer",
					type: "error",
				},
				{
					inputs: [],
					name: "NoXpMinted",
					type: "error",
				},
				{
					inputs: [],
					name: "OnlyServer",
					type: "error",
				},
				{
					inputs: [],
					name: "ReentrancyGuardReentrantCall",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "token",
							type: "address",
						},
					],
					name: "SafeERC20FailedOperation",
					type: "error",
				},
				{
					inputs: [],
					name: "ZeroXp",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "user",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "RewardClaimed",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "RewardsDistributed",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "user",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
						{
							indexed: false,
							internalType: "bytes8",
							name: "reason",
							type: "bytes8",
						},
						{
							indexed: false,
							internalType: "bytes8",
							name: "reasonResourceIdentifier",
							type: "bytes8",
						},
					],
					name: "XpMinted",
					type: "event",
				},
				{
					inputs: [],
					name: "accRewardPerXp",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "certificationAuthority",
					outputs: [
						{
							internalType: "contract PanthaCertificationAuthority",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "claim",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newServer_",
							type: "address",
						},
					],
					name: "cycleServer",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "amount_",
							type: "uint256",
						},
					],
					name: "distribute",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "keyStore",
					outputs: [
						{
							internalType: "contract PanthaKeyStore",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "recipient_",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "amount_",
							type: "uint256",
						},
						{
							internalType: "bytes8",
							name: "reason_",
							type: "bytes8",
						},
						{
							internalType: "bytes8",
							name: "reasonResourceIdentifier_",
							type: "bytes8",
						},
					],
					name: "mintXp",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "panthaToken",
					outputs: [
						{
							internalType: "contract IERC20PermitToken",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user",
							type: "address",
						},
					],
					name: "pendingRewards",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "pxp",
					outputs: [
						{
							internalType: "contract PXP",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "rewardDebt",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "server",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "shop",
					outputs: [
						{
							internalType: "contract PanthaShop",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "totalXp",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "treasury",
					outputs: [
						{
							internalType: "contract PanthaTreasury",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "userXp",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
		PanthaCertificate: {
			address: "0x6b240129eD1212Bdfd3E1BF6e7E5e7B6114e36db",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "ERC721IncorrectOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "ERC721InsufficientApproval",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "approver",
							type: "address",
						},
					],
					name: "ERC721InvalidApprover",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
					],
					name: "ERC721InvalidOperator",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "ERC721InvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "receiver",
							type: "address",
						},
					],
					name: "ERC721InvalidReceiver",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
					],
					name: "ERC721InvalidSender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "ERC721NonexistentToken",
					type: "error",
				},
				{
					inputs: [],
					name: "NotAuthorized",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "approved",
							type: "address",
						},
						{
							indexed: true,
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "Approval",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "operator",
							type: "address",
						},
						{
							indexed: false,
							internalType: "bool",
							name: "approved",
							type: "bool",
						},
					],
					name: "ApprovalForAll",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: false,
							internalType: "uint256",
							name: "_fromTokenId",
							type: "uint256",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "_toTokenId",
							type: "uint256",
						},
					],
					name: "BatchMetadataUpdate",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: false,
							internalType: "uint256",
							name: "_tokenId",
							type: "uint256",
						},
					],
					name: "MetadataUpdate",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							indexed: true,
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "Transfer",
					type: "event",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "approve",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "authority",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "balanceOf",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "getApproved",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
					],
					name: "isApprovedForAll",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "string",
							name: "metadataURI",
							type: "string",
						},
					],
					name: "mint",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "name",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "nextTokenId",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "ownerOf",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "safeTransferFrom",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
						{
							internalType: "bytes",
							name: "data",
							type: "bytes",
						},
					],
					name: "safeTransferFrom",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
						{
							internalType: "bool",
							name: "approved",
							type: "bool",
						},
					],
					name: "setApprovalForAll",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "bytes4",
							name: "interfaceId",
							type: "bytes4",
						},
					],
					name: "supportsInterface",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "symbol",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "tokenURI",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "transferFrom",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PanthaKeyStore: {
			address: "0xF10c7057CdFC538051A3934D3c604DFA71F7a8f0",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "DataAlreadyRegistered",
					type: "error",
				},
				{
					inputs: [],
					name: "ECDSAInvalidSignature",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "length",
							type: "uint256",
						},
					],
					name: "ECDSAInvalidSignatureLength",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
					],
					name: "ECDSAInvalidSignatureS",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidChallengeSalt",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidPublicKey",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidSeedSalt",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidShortString",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidSignature",
					type: "error",
				},
				{
					inputs: [],
					name: "OnlyServer",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "string",
							name: "str",
							type: "string",
						},
					],
					name: "StringTooLong",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [],
					name: "EIP712DomainChanged",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "user",
							type: "address",
						},
					],
					name: "KeygenDataRegistered",
					type: "event",
				},
				{
					inputs: [],
					name: "eip712Domain",
					outputs: [
						{
							internalType: "bytes1",
							name: "fields",
							type: "bytes1",
						},
						{
							internalType: "string",
							name: "name",
							type: "string",
						},
						{
							internalType: "string",
							name: "version",
							type: "string",
						},
						{
							internalType: "uint256",
							name: "chainId",
							type: "uint256",
						},
						{
							internalType: "address",
							name: "verifyingContract",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "salt",
							type: "bytes32",
						},
						{
							internalType: "uint256[]",
							name: "extensions",
							type: "uint256[]",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "isRegistered",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "keygenData",
					outputs: [
						{
							internalType: "bytes32",
							name: "seedSalt",
							type: "bytes32",
						},
						{
							internalType: "bytes20",
							name: "challengeSalt",
							type: "bytes20",
						},
						{
							internalType: "bytes32",
							name: "publicKey",
							type: "bytes32",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "orchestrator",
					outputs: [
						{
							internalType: "contract IPanthaOrchestrator",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user_",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "seedSalt_",
							type: "bytes32",
						},
						{
							internalType: "bytes20",
							name: "challengeSalt_",
							type: "bytes20",
						},
						{
							internalType: "bytes32",
							name: "publicKey_",
							type: "bytes32",
						},
						{
							internalType: "bytes",
							name: "signature_",
							type: "bytes",
						},
					],
					name: "registerKeygenData",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "seedSalt_",
							type: "bytes32",
						},
						{
							internalType: "bytes20",
							name: "challengeSalt_",
							type: "bytes20",
						},
						{
							internalType: "bytes32",
							name: "publicKey_",
							type: "bytes32",
						},
						{
							internalType: "bytes",
							name: "signature_",
							type: "bytes",
						},
						{
							internalType: "address",
							name: "walletAddress_",
							type: "address",
						},
					],
					name: "validateKeygenDataRegistrationSignature",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
		PanthaCertificationAuthority: {
			address: "0xb6B58Ba59218DCaDC00e861d796C92829E326387",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "ActionChainRootAlreadyUsed",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidActionChainRoot",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidUser",
					type: "error",
				},
				{
					inputs: [],
					name: "NoActionChainRoot",
					type: "error",
				},
				{
					inputs: [],
					name: "OnlyOrchestrator",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "actionChainMerkleRoots",
					outputs: [
						{
							internalType: "bytes32",
							name: "",
							type: "bytes32",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "certificate",
					outputs: [
						{
							internalType: "contract PanthaCertificate",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user_",
							type: "address",
						},
					],
					name: "certify",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user_",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "actionChainRoot_",
							type: "bytes32",
						},
					],
					name: "commitActionChainRoot",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "orchestrator",
					outputs: [
						{
							internalType: "contract IPanthaOrchestrator",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "",
							type: "bytes32",
						},
					],
					name: "usedActionChainRoots",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
		PanthaToken: {
			address: "0xf8e6934459845be5ea42e3f51265be4642729474",
			abi: [
				{
					inputs: [
						{
							internalType: "uint256",
							name: "initialSupply_",
							type: "uint256",
						},
					],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "ECDSAInvalidSignature",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "length",
							type: "uint256",
						},
					],
					name: "ECDSAInvalidSignatureLength",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
					],
					name: "ECDSAInvalidSignatureS",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "allowance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientAllowance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "balance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientBalance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "approver",
							type: "address",
						},
					],
					name: "ERC20InvalidApprover",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "receiver",
							type: "address",
						},
					],
					name: "ERC20InvalidReceiver",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
					],
					name: "ERC20InvalidSender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "ERC20InvalidSpender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "deadline",
							type: "uint256",
						},
					],
					name: "ERC2612ExpiredSignature",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "signer",
							type: "address",
						},
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "ERC2612InvalidSigner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "currentNonce",
							type: "uint256",
						},
					],
					name: "InvalidAccountNonce",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidShortString",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "OwnableInvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "OwnableUnauthorizedAccount",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "string",
							name: "str",
							type: "string",
						},
					],
					name: "StringTooLong",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Approval",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [],
					name: "EIP712DomainChanged",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "previousOwner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "OwnershipTransferred",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Transfer",
					type: "event",
				},
				{
					inputs: [],
					name: "DOMAIN_SEPARATOR",
					outputs: [
						{
							internalType: "bytes32",
							name: "",
							type: "bytes32",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "allowance",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "approve",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "balanceOf",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "decimals",
					outputs: [
						{
							internalType: "uint8",
							name: "",
							type: "uint8",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "eip712Domain",
					outputs: [
						{
							internalType: "bytes1",
							name: "fields",
							type: "bytes1",
						},
						{
							internalType: "string",
							name: "name",
							type: "string",
						},
						{
							internalType: "string",
							name: "version",
							type: "string",
						},
						{
							internalType: "uint256",
							name: "chainId",
							type: "uint256",
						},
						{
							internalType: "address",
							name: "verifyingContract",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "salt",
							type: "bytes32",
						},
						{
							internalType: "uint256[]",
							name: "extensions",
							type: "uint256[]",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "name",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "nonces",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "owner",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "deadline",
							type: "uint256",
						},
						{
							internalType: "uint8",
							name: "v",
							type: "uint8",
						},
						{
							internalType: "bytes32",
							name: "r",
							type: "bytes32",
						},
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
					],
					name: "permit",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "renounceOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "symbol",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "totalSupply",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "transfer",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "transferFrom",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "transferOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PXP: {
			address: "0x6F1D8a780F65a03B908D5b8Ec39c46Ea6cf4d4D4",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "allowance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientAllowance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "balance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientBalance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "approver",
							type: "address",
						},
					],
					name: "ERC20InvalidApprover",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "receiver",
							type: "address",
						},
					],
					name: "ERC20InvalidReceiver",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
					],
					name: "ERC20InvalidSender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "ERC20InvalidSpender",
					type: "error",
				},
				{
					inputs: [],
					name: "NonTransferable",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "OwnableInvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "OwnableUnauthorizedAccount",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Approval",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "previousOwner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "OwnershipTransferred",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Transfer",
					type: "event",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "allowance",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					name: "approve",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "balanceOf",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "decimals",
					outputs: [
						{
							internalType: "uint8",
							name: "",
							type: "uint8",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "mint",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "name",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "owner",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "renounceOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "symbol",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "totalSupply",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					name: "transfer",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					name: "transferFrom",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "transferOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PanthaTreasury: {
			address: "0xe3373c9B1E91b6cF2c0f08390B982f21779aB5bC",
			abi: [
				{
					inputs: [
						{
							internalType: "contract IERC20",
							name: "token_",
							type: "address",
						},
					],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "OwnableInvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "OwnableUnauthorizedAccount",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "previousOwner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "OwnershipTransferred",
					type: "event",
				},
				{
					inputs: [],
					name: "owner",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "renounceOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "token",
					outputs: [
						{
							internalType: "contract IERC20",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "transferOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "withdraw",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PanthaShop: {
			address: "0x757c69543CEAa70F2d3985f6f9ebe8089Cf3d0d7",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "buyer",
							type: "address",
						},
						{
							indexed: true,
							internalType: "bytes8",
							name: "itemId",
							type: "bytes8",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "ItemPurchased",
					type: "event",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "deadline",
							type: "uint256",
						},
						{
							internalType: "uint8",
							name: "v",
							type: "uint8",
						},
						{
							internalType: "bytes32",
							name: "r",
							type: "bytes32",
						},
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
						{
							internalType: "bytes8",
							name: "itemId",
							type: "bytes8",
						},
					],
					name: "buyWithPermit",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "orchestrator",
					outputs: [
						{
							internalType: "contract IPanthaOrchestrator",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
	},
	"0x7a69": {
		PanthaOrchestrator: {
			address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
			abi: [
				{
					inputs: [
						{
							internalType: "contract IERC20PermitToken",
							name: "panthaToken_",
							type: "address",
						},
					],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "InvalidRecipient",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidServer",
					type: "error",
				},
				{
					inputs: [],
					name: "NoXpMinted",
					type: "error",
				},
				{
					inputs: [],
					name: "OnlyServer",
					type: "error",
				},
				{
					inputs: [],
					name: "ReentrancyGuardReentrantCall",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "token",
							type: "address",
						},
					],
					name: "SafeERC20FailedOperation",
					type: "error",
				},
				{
					inputs: [],
					name: "ZeroXp",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "user",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "RewardClaimed",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "RewardsDistributed",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "user",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
						{
							indexed: false,
							internalType: "bytes8",
							name: "reason",
							type: "bytes8",
						},
						{
							indexed: false,
							internalType: "bytes8",
							name: "reasonResourceIdentifier",
							type: "bytes8",
						},
					],
					name: "XpMinted",
					type: "event",
				},
				{
					inputs: [],
					name: "accRewardPerXp",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "certificationAuthority",
					outputs: [
						{
							internalType: "contract PanthaCertificationAuthority",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "claim",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newServer_",
							type: "address",
						},
					],
					name: "cycleServer",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "amount_",
							type: "uint256",
						},
					],
					name: "distribute",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "keyStore",
					outputs: [
						{
							internalType: "contract PanthaKeyStore",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "recipient_",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "amount_",
							type: "uint256",
						},
						{
							internalType: "bytes8",
							name: "reason_",
							type: "bytes8",
						},
						{
							internalType: "bytes8",
							name: "reasonResourceIdentifier_",
							type: "bytes8",
						},
					],
					name: "mintXp",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "panthaToken",
					outputs: [
						{
							internalType: "contract IERC20PermitToken",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user",
							type: "address",
						},
					],
					name: "pendingRewards",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "pxp",
					outputs: [
						{
							internalType: "contract PXP",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "rewardDebt",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "server",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "shop",
					outputs: [
						{
							internalType: "contract PanthaShop",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "totalXp",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "treasury",
					outputs: [
						{
							internalType: "contract PanthaTreasury",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "userXp",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
		PanthaCertificate: {
			address: "0x2d2c18F63D2144161B38844dCd529124Fbb93cA2",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "ERC721IncorrectOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "ERC721InsufficientApproval",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "approver",
							type: "address",
						},
					],
					name: "ERC721InvalidApprover",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
					],
					name: "ERC721InvalidOperator",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "ERC721InvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "receiver",
							type: "address",
						},
					],
					name: "ERC721InvalidReceiver",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
					],
					name: "ERC721InvalidSender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "ERC721NonexistentToken",
					type: "error",
				},
				{
					inputs: [],
					name: "NotAuthorized",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "approved",
							type: "address",
						},
						{
							indexed: true,
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "Approval",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "operator",
							type: "address",
						},
						{
							indexed: false,
							internalType: "bool",
							name: "approved",
							type: "bool",
						},
					],
					name: "ApprovalForAll",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: false,
							internalType: "uint256",
							name: "_fromTokenId",
							type: "uint256",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "_toTokenId",
							type: "uint256",
						},
					],
					name: "BatchMetadataUpdate",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: false,
							internalType: "uint256",
							name: "_tokenId",
							type: "uint256",
						},
					],
					name: "MetadataUpdate",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							indexed: true,
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "Transfer",
					type: "event",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "approve",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "authority",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "balanceOf",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "getApproved",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
					],
					name: "isApprovedForAll",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "string",
							name: "metadataURI",
							type: "string",
						},
					],
					name: "mint",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "name",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "nextTokenId",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "ownerOf",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "safeTransferFrom",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
						{
							internalType: "bytes",
							name: "data",
							type: "bytes",
						},
					],
					name: "safeTransferFrom",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "operator",
							type: "address",
						},
						{
							internalType: "bool",
							name: "approved",
							type: "bool",
						},
					],
					name: "setApprovalForAll",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "bytes4",
							name: "interfaceId",
							type: "bytes4",
						},
					],
					name: "supportsInterface",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "symbol",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "tokenURI",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "tokenId",
							type: "uint256",
						},
					],
					name: "transferFrom",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PanthaKeyStore: {
			address: "0xbf9fBFf01664500A33080Da5d437028b07DFcC55",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "DataAlreadyRegistered",
					type: "error",
				},
				{
					inputs: [],
					name: "ECDSAInvalidSignature",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "length",
							type: "uint256",
						},
					],
					name: "ECDSAInvalidSignatureLength",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
					],
					name: "ECDSAInvalidSignatureS",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidChallengeSalt",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidPublicKey",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidSeedSalt",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidShortString",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidSignature",
					type: "error",
				},
				{
					inputs: [],
					name: "OnlyServer",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "string",
							name: "str",
							type: "string",
						},
					],
					name: "StringTooLong",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [],
					name: "EIP712DomainChanged",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "user",
							type: "address",
						},
					],
					name: "KeygenDataRegistered",
					type: "event",
				},
				{
					inputs: [],
					name: "eip712Domain",
					outputs: [
						{
							internalType: "bytes1",
							name: "fields",
							type: "bytes1",
						},
						{
							internalType: "string",
							name: "name",
							type: "string",
						},
						{
							internalType: "string",
							name: "version",
							type: "string",
						},
						{
							internalType: "uint256",
							name: "chainId",
							type: "uint256",
						},
						{
							internalType: "address",
							name: "verifyingContract",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "salt",
							type: "bytes32",
						},
						{
							internalType: "uint256[]",
							name: "extensions",
							type: "uint256[]",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "isRegistered",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "keygenData",
					outputs: [
						{
							internalType: "bytes32",
							name: "seedSalt",
							type: "bytes32",
						},
						{
							internalType: "bytes20",
							name: "challengeSalt",
							type: "bytes20",
						},
						{
							internalType: "bytes32",
							name: "publicKey",
							type: "bytes32",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "orchestrator",
					outputs: [
						{
							internalType: "contract IPanthaOrchestrator",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user_",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "seedSalt_",
							type: "bytes32",
						},
						{
							internalType: "bytes20",
							name: "challengeSalt_",
							type: "bytes20",
						},
						{
							internalType: "bytes32",
							name: "publicKey_",
							type: "bytes32",
						},
						{
							internalType: "bytes",
							name: "signature_",
							type: "bytes",
						},
					],
					name: "registerKeygenData",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "seedSalt_",
							type: "bytes32",
						},
						{
							internalType: "bytes20",
							name: "challengeSalt_",
							type: "bytes20",
						},
						{
							internalType: "bytes32",
							name: "publicKey_",
							type: "bytes32",
						},
						{
							internalType: "bytes",
							name: "signature_",
							type: "bytes",
						},
						{
							internalType: "address",
							name: "walletAddress_",
							type: "address",
						},
					],
					name: "validateKeygenDataRegistrationSignature",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
		PanthaCertificationAuthority: {
			address: "0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "ActionChainRootAlreadyUsed",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidActionChainRoot",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidUser",
					type: "error",
				},
				{
					inputs: [],
					name: "NoActionChainRoot",
					type: "error",
				},
				{
					inputs: [],
					name: "OnlyOrchestrator",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					name: "actionChainMerkleRoots",
					outputs: [
						{
							internalType: "bytes32",
							name: "",
							type: "bytes32",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "certificate",
					outputs: [
						{
							internalType: "contract PanthaCertificate",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user_",
							type: "address",
						},
					],
					name: "certify",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "user_",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "actionChainRoot_",
							type: "bytes32",
						},
					],
					name: "commitActionChainRoot",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "orchestrator",
					outputs: [
						{
							internalType: "contract IPanthaOrchestrator",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "",
							type: "bytes32",
						},
					],
					name: "usedActionChainRoots",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
		PanthaToken: {
			address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
			abi: [
				{
					inputs: [
						{
							internalType: "uint256",
							name: "initialSupply_",
							type: "uint256",
						},
					],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [],
					name: "ECDSAInvalidSignature",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "length",
							type: "uint256",
						},
					],
					name: "ECDSAInvalidSignatureLength",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
					],
					name: "ECDSAInvalidSignatureS",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "allowance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientAllowance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "balance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientBalance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "approver",
							type: "address",
						},
					],
					name: "ERC20InvalidApprover",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "receiver",
							type: "address",
						},
					],
					name: "ERC20InvalidReceiver",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
					],
					name: "ERC20InvalidSender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "ERC20InvalidSpender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "uint256",
							name: "deadline",
							type: "uint256",
						},
					],
					name: "ERC2612ExpiredSignature",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "signer",
							type: "address",
						},
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "ERC2612InvalidSigner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "currentNonce",
							type: "uint256",
						},
					],
					name: "InvalidAccountNonce",
					type: "error",
				},
				{
					inputs: [],
					name: "InvalidShortString",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "OwnableInvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "OwnableUnauthorizedAccount",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "string",
							name: "str",
							type: "string",
						},
					],
					name: "StringTooLong",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Approval",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [],
					name: "EIP712DomainChanged",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "previousOwner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "OwnershipTransferred",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Transfer",
					type: "event",
				},
				{
					inputs: [],
					name: "DOMAIN_SEPARATOR",
					outputs: [
						{
							internalType: "bytes32",
							name: "",
							type: "bytes32",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "allowance",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "approve",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "balanceOf",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "decimals",
					outputs: [
						{
							internalType: "uint8",
							name: "",
							type: "uint8",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "eip712Domain",
					outputs: [
						{
							internalType: "bytes1",
							name: "fields",
							type: "bytes1",
						},
						{
							internalType: "string",
							name: "name",
							type: "string",
						},
						{
							internalType: "string",
							name: "version",
							type: "string",
						},
						{
							internalType: "uint256",
							name: "chainId",
							type: "uint256",
						},
						{
							internalType: "address",
							name: "verifyingContract",
							type: "address",
						},
						{
							internalType: "bytes32",
							name: "salt",
							type: "bytes32",
						},
						{
							internalType: "uint256[]",
							name: "extensions",
							type: "uint256[]",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "name",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "nonces",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "owner",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "deadline",
							type: "uint256",
						},
						{
							internalType: "uint8",
							name: "v",
							type: "uint8",
						},
						{
							internalType: "bytes32",
							name: "r",
							type: "bytes32",
						},
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
					],
					name: "permit",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "renounceOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "symbol",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "totalSupply",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "transfer",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "transferFrom",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "transferOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PXP: {
			address: "0xCafac3dD18aC6c6e92c921884f9E4176737C052c",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "allowance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientAllowance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "balance",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "needed",
							type: "uint256",
						},
					],
					name: "ERC20InsufficientBalance",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "approver",
							type: "address",
						},
					],
					name: "ERC20InvalidApprover",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "receiver",
							type: "address",
						},
					],
					name: "ERC20InvalidReceiver",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "sender",
							type: "address",
						},
					],
					name: "ERC20InvalidSender",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "ERC20InvalidSpender",
					type: "error",
				},
				{
					inputs: [],
					name: "NonTransferable",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "OwnableInvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "OwnableUnauthorizedAccount",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "spender",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Approval",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "previousOwner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "OwnershipTransferred",
					type: "event",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "from",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
					],
					name: "Transfer",
					type: "event",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "address",
							name: "spender",
							type: "address",
						},
					],
					name: "allowance",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					name: "approve",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "balanceOf",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "decimals",
					outputs: [
						{
							internalType: "uint8",
							name: "",
							type: "uint8",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "mint",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "name",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "owner",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "renounceOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "symbol",
					outputs: [
						{
							internalType: "string",
							name: "",
							type: "string",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "totalSupply",
					outputs: [
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					name: "transfer",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "address",
							name: "",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "",
							type: "uint256",
						},
					],
					name: "transferFrom",
					outputs: [
						{
							internalType: "bool",
							name: "",
							type: "bool",
						},
					],
					stateMutability: "pure",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "transferOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PanthaTreasury: {
			address: "0x93b6BDa6a0813D808d75aA42e900664Ceb868bcF",
			abi: [
				{
					inputs: [
						{
							internalType: "contract IERC20",
							name: "token_",
							type: "address",
						},
					],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
					],
					name: "OwnableInvalidOwner",
					type: "error",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "account",
							type: "address",
						},
					],
					name: "OwnableUnauthorizedAccount",
					type: "error",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "previousOwner",
							type: "address",
						},
						{
							indexed: true,
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "OwnershipTransferred",
					type: "event",
				},
				{
					inputs: [],
					name: "owner",
					outputs: [
						{
							internalType: "address",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [],
					name: "renounceOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "token",
					outputs: [
						{
							internalType: "contract IERC20",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "newOwner",
							type: "address",
						},
					],
					name: "transferOwnership",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "to",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "withdraw",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
			],
		},
		PanthaShop: {
			address: "0xA22D78bc37cE77FeE1c44F0C2C0d2524318570c3",
			abi: [
				{
					inputs: [],
					stateMutability: "nonpayable",
					type: "constructor",
				},
				{
					anonymous: false,
					inputs: [
						{
							indexed: true,
							internalType: "address",
							name: "buyer",
							type: "address",
						},
						{
							indexed: true,
							internalType: "bytes8",
							name: "itemId",
							type: "bytes8",
						},
						{
							indexed: false,
							internalType: "uint256",
							name: "amount",
							type: "uint256",
						},
					],
					name: "ItemPurchased",
					type: "event",
				},
				{
					inputs: [
						{
							internalType: "address",
							name: "owner",
							type: "address",
						},
						{
							internalType: "uint256",
							name: "value",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "deadline",
							type: "uint256",
						},
						{
							internalType: "uint8",
							name: "v",
							type: "uint8",
						},
						{
							internalType: "bytes32",
							name: "r",
							type: "bytes32",
						},
						{
							internalType: "bytes32",
							name: "s",
							type: "bytes32",
						},
						{
							internalType: "bytes8",
							name: "itemId",
							type: "bytes8",
						},
					],
					name: "buyWithPermit",
					outputs: [],
					stateMutability: "nonpayable",
					type: "function",
				},
				{
					inputs: [],
					name: "orchestrator",
					outputs: [
						{
							internalType: "contract IPanthaOrchestrator",
							name: "",
							type: "address",
						},
					],
					stateMutability: "view",
					type: "function",
				},
			],
		},
	},
} as const;
