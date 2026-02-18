import { useRef } from "react"
import { createInitializeMint2Instruction, createMint, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js"

export function TokenLauncpad(){

    const nameRef=useRef<any>("")
    const symbolRef=useRef<any>("")
    const imageRef =useRef<any>("")
    const supplyRef=useRef<any>("")

    const {connection}=useConnection()
    const wallet=useWallet()

    async function  createMintToken() {
        const name=nameRef.current.value;
        const symbol=symbolRef.current.value;
        const image=imageRef.current.value;
        const supply=supplyRef.current.value;

        console.log(name, symbol, image, supply);

         const lamports = await getMinimumBalanceForRentExemptMint(connection);
         const keyPair=Keypair.generate();

         if(!wallet.publicKey) throw new Error("public key not found")

          const transaction = new Transaction().add(
            SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: keyPair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId:TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(keyPair.publicKey, 9, wallet.publicKey, wallet.publicKey, TOKEN_PROGRAM_ID)
    )

        const recentBlockHash=await connection.getLatestBlockhash();
        transaction.recentBlockhash=recentBlockHash.blockhash;
        transaction.feePayer=wallet.publicKey;
        
        transaction.partialSign(keyPair);
        let response=  wallet.sendTransaction(transaction,connection)

        console.log(response);
        
      
    }


    return <div className="grid gap-2 m-2">
        <input ref={nameRef}  className="px-2 py 1 border" type="text" placeholder="token name" />
        <input ref={symbolRef} className="px-2 py 1 border" type="text" placeholder="symbol" />
        <input ref={imageRef} className="px-2 py 1 border" type="text" placeholder="image Url"/>
        <input ref={supplyRef} className="px-2 py 1 border" type="text" placeholder="Initial Supply"/>
        <button onClick={createMintToken} className="px-2 py-1 bg-indigo-500 rounded-lg border text-white font-bold hover:bg-indigo-700 w-[20%]">create</button>
    </div>
}