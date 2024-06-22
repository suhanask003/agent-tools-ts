import {
  TransactionSigner,
  broadcastTransaction,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
  publicKeyToString,
} from "@stacks/transactions";
import { deriveChildAccount } from "../utilities";
import { buildRegisterNameTx } from "@stacks/bns";

// CONFIGURATION
const NETWORK = Bun.env.network;
const MNEMONIC = Bun.env.mnemonic;
const ACCOUNT_INDEX = Bun.env.accountIndex;

async function registerName(name: string, zonefile: string, salt: string) {
  try {
    // Derive child account from mnemonic
    const { address, key } = await deriveChildAccount(
      NETWORK,
      MNEMONIC,
      ACCOUNT_INDEX
    );

    const publicKey = publicKeyToString(pubKeyfromPrivKey(key));

    // Build the transaction for registering the name
    const unsignedTX = await buildRegisterNameTx({
      fullyQualifiedName: name,
      network: NETWORK,
      publicKey,
      salt,
      zonefile,
    });

    // Sign the transaction
    const signer = new TransactionSigner(unsignedTX);
    signer.signOrigin(createStacksPrivateKey(key));

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      signer.transaction,
      NETWORK,
      Buffer.from(zonefile)
    );

    // Handle the response
    if ("error" in broadcastResponse) {
      console.error("Transaction failed to broadcast");
      console.error(`Error: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.error(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.error(
          `Reason Data: ${JSON.stringify(
            broadcastResponse.reason_data,
            null,
            2
          )}`
        );
      }
    } else {
      console.log("Transaction broadcasted successfully!");
      console.log(`FROM: ${address}`);
      console.log(`TXID: 0x${broadcastResponse.txid}`);
    }
  } catch (error) {
    console.error(`Error registering name: ${error}`);
  }
}

// Get the name, zonefile, and salt from command line arguments and call registerName
const name = process.argv[2];
const zonefile = process.argv[3];
const salt = process.argv[4];

if (name && zonefile && salt) {
  registerName(name, zonefile, salt);
} else {
  console.error("Please provide a name, zonefile, and salt as arguments.");
}
