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
} from "@solana/spl-token";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";

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

      const mintKeypair = Keypair.generate();

      // ✅ Only MetadataPointer extension
      const mintLen = getMintLen([ExtensionType.MetadataPointer]);

      const lamports =
        await connection.getMinimumBalanceForRentExemption(mintLen);

      const associatedToken = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction().add(
        // 1️⃣ Create Mint Account
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),

        // 2️⃣ Initialize Metadata Pointer
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          wallet.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),

        // 3️⃣ Initialize Mint
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          decimals,
          wallet.publicKey,
          wallet.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),

        // 4️⃣ Create ATA
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedToken,
          wallet.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),

        // 5️⃣ Mint Initial Supply
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedToken,
          wallet.publicKey,
          BigInt(supplyInput) * BigInt(10 ** decimals),
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      transaction.partialSign(mintKeypair);

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      console.log("✅ Token Created");
      console.log("Mint:", mintKeypair.publicKey.toBase58());
      console.log("ATA:", associatedToken.toBase58());
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