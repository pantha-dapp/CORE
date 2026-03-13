export const definitions = {
	"0x221": {
		PanthaOrchestrator: {
			address: "0x39c8bf15b151ea46ffb9e2137833cc42feb5aa09",
			abi: [
				{
					inputs: [
						{
							internalType: "contract IERC20",
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
			address: "0x6CdAee5a5620c150A3a06a20CBE88a1866b24AC5",
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
			address: "0xccFAB91E44B904350980717A2C7b74ac4512576B",
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
			address: "0xF4989993650130ba7b237DAc3A9901390E71c2cE",
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
			address: "0x8fd9dc6a625dbe7d7cc7a82910d72324411aa9de",
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
			address: "0xF35429b10877F65d23d5103905756E190fb4e625",
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
	},
} as const;
