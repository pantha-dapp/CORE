import { isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import env from "../env";
import { FilecoinSynapseObjectStorage } from "../lib/objectStorage/synapse";

if (!env.EVM_PRIVATE_KEY_SYNAPSE || !isHex(env.EVM_PRIVATE_KEY_SYNAPSE)) {
	throw new Error(
		"EVM_PRIVATE_KEY_SYNAPSE environment variable is required and must be a valid hex string",
	);
}

const s = new FilecoinSynapseObjectStorage({
	account: privateKeyToAccount(env.EVM_PRIVATE_KEY_SYNAPSE),
	environment: "dev",
	source: "synapse-payments-script",
});

console.log("Depositing with address ", s.$synapse.client.account.address);

const amount = 5 * 10 ** 18;
await s.$synapse.payments.deposit({ amount: BigInt(amount) });

const prep = await s.$synapse.storage.prepare({
	dataSize: 1073741824n, // 1 GiB
});

if (prep.transaction) {
	const { hash } = await prep.transaction.execute();
	console.log(`✅ Account funded and approved (tx: ${hash})`);
}
