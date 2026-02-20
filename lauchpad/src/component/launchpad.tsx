import { useRef } from "react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  TYPE_SIZE,
  LENGTH_SIZE,
  createInitializeMintInstruction,
  getAccountLen,
  createInitializeAccountInstruction,
} from "@solana/spl-token";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { createInitializeInstruction, pack, type TokenMetadata } from "@solana/spl-token-metadata";

export function TokenLaunchpad() {
  const nameRef = useRef<any>("");
  const symbolRef = useRef<any>("");
  const imageRef = useRef<any>("");
  const supplyRef = useRef<any>("");

  const { connection } = useConnection();
  const wallet = useWallet();

  async function createMintToken() {
    try {
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      const supplyInput = supplyRef.current.value;
      const decimals = 9;
      const name=nameRef.current.value;
      const symbol=symbolRef.current.value;
      const uri=imageRef.current.value;


      const mintKeypair = Keypair.generate();

      const metadata:TokenMetadata = {
  mint: mintKeypair.publicKey,
  name: name,
  symbol: symbol,
  uri: uri,
  additionalMetadata: [["description", "Only Possible On Solana"]]
};

const metadataLen=pack(metadata).length;
const metadataExtension = TYPE_SIZE + LENGTH_SIZE;

const spaceWithoutMetadataExtension = getMintLen([
  ExtensionType.MetadataPointer
]);


const lamportsForMint = await connection.getMinimumBalanceForRentExemption(
  spaceWithoutMetadataExtension + metadataLen + metadataExtension
);


      // ✅ Only MetadataPointer extension
     
      const createMintAccountIx = SystemProgram.createAccount({
  fromPubkey: wallet.publicKey,
  newAccountPubkey: mintKeypair.publicKey,
  space: spaceWithoutMetadataExtension  + metadataExtension + metadataLen,
  lamports: lamportsForMint,
  programId: TOKEN_2022_PROGRAM_ID
});


const initializeMetadataPointerIx = createInitializeMetadataPointerInstruction(
  mintKeypair.publicKey, // mint account
  wallet.publicKey, // authority
  mintKeypair.publicKey, // metadata address
  TOKEN_2022_PROGRAM_ID
);

const initializeMintIx = createInitializeMintInstruction(
  mintKeypair.publicKey, // mint
  9, // decimals
  wallet.publicKey, // mint authority
  wallet.publicKey, // freeze authority
  TOKEN_2022_PROGRAM_ID
);

const initializeMetadataIx = createInitializeInstruction({
  programId: TOKEN_2022_PROGRAM_ID,
  mint: mintKeypair.publicKey,
  metadata: mintKeypair.publicKey,
  mintAuthority: wallet.publicKey,
  name: name,
  symbol: symbol,
  uri: uri,
  updateAuthority: wallet.publicKey
});



      

  const tokenAccount = Keypair.generate();
const accountLen = getAccountLen([]);
const lamportsForAccount =
  await connection.getMinimumBalanceForRentExemption(accountLen);
const createTokenAccountIx = SystemProgram.createAccount({
  fromPubkey: wallet.publicKey,
  newAccountPubkey: tokenAccount.publicKey,
  space: accountLen,
  lamports: lamportsForAccount,
  programId: TOKEN_2022_PROGRAM_ID
});
const initializeTokenAccountIx = createInitializeAccountInstruction(
  tokenAccount.publicKey,
  mintKeypair.publicKey,
  wallet.publicKey,
  TOKEN_2022_PROGRAM_ID
);

const mintToIx = createMintToInstruction(
  mintKeypair.publicKey,           // mint
  tokenAccount.publicKey,          // destination token account
  wallet.publicKey,                // mint authority
  BigInt(supplyInput) * BigInt(10 ** decimals), // amount (adjusted for decimals)
  [],
  TOKEN_2022_PROGRAM_ID
);

// Build transaction
const transaction = new Transaction().add(
  createMintAccountIx,
  initializeMetadataPointerIx,
  initializeMintIx,
  initializeMetadataIx,
  createTokenAccountIx,         // ✅ was missing
  initializeTokenAccountIx,     // ✅ was missing
  mintToIx  
);

transaction.feePayer=wallet.publicKey;
transaction.recentBlockhash= (await connection.getLatestBlockhash()).blockhash;
transaction.partialSign(mintKeypair,tokenAccount);
// Send and confirm transaction
const signature=await wallet.sendTransaction(transaction,connection)
console.log("transaction sent");
console.log(signature);
console.log("Mint Address:", mintKeypair.publicKey.toBase58());
console.log("Token Account:", tokenAccount.publicKey.toBase58());
    } catch (err) {
      console.error("❌ Error:", err);
    }
  }

  return (
    <div className="grid gap-2 m-2">
      <input ref={nameRef} placeholder="Token name" className="border px-2 py-1" />
      <input ref={symbolRef} placeholder="Symbol" className="border px-2 py-1" />
      <input ref={imageRef} placeholder="Metadata URI" className="border px-2 py-1" />
      <input ref={supplyRef} placeholder="Initial Supply" className="border px-2 py-1" />
      <button
        onClick={createMintToken}
        className="px-3 py-2 bg-indigo-600 text-white rounded"
      >
        Create
      </button>
    </div>
  );
}