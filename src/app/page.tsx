"use client"
import React, { useState } from 'react';
import { Address, http, createPublicClient } from 'viem';
import { eip712WalletActions } from 'viem/zksync'
import { zkSync } from 'viem/chains'
import { useWalletClient } from 'wagmi';
import Link from 'next/link';

const TOKEN_TO_SEND = "0xBBeB516fb02a01611cBBE0453Fe3c580D7281011" //WBTC
const ETH_AMOUNT = 1000n; // amount of wei to send
const API_URL = 'https://api.zyfi.org/api/erc20_paymaster/v1' // Zyfi's API for crafting paymaster transactions

// create a custom public Client to send raw transactions to the provided RPC,
// instead of sending trhough the users wallet, as it is not supported on mobile
const RPC_URL = 'https://mainnet.era.zksync.io'
const transport = http(RPC_URL)
const customClient = createPublicClient({
  chain: zkSync,
  transport
})

export default function EthPage() {

  const [txHash, setTxHash] = useState<string>(''); // hash of the transaction
  const [toAddress, setToAddress] = useState<Address>('0x'); // address to send ETH to
  const { data: walletClient } = useWalletClient(); // use wallet connected through web3modal

  // Checks if an address is a valid Ethereum address
  function isValidEthereumAddress(toAddress: Address) {
    return /^0x[a-fA-F0-9]{40}$/.test(toAddress);
  }

  const clickSendTransaction = async () => {
    //update display
    setTxHash('')

    //checks
    if (!walletClient) {
      alert('Please connect your wallet');
      return;
    }
    if (!isValidEthereumAddress(toAddress)) {
      alert('Invalid Ethereum address, please enter a valid Ethereum address.');
      return;
    }

    const address = walletClient.account.address

    // tx request for Zyfi's API
    const txRequest = {
      "feeTokenAddress": TOKEN_TO_SEND,
      "isTestnet": false,
      "txData": {
        "from": address,
        "to": toAddress,
        "value": ETH_AMOUNT.toString(),
        "data": "0x"
      }
    }

    // paymaster data received from Zyfi's API
    const pmData = await submitTxDataToAPI(API_URL, txRequest)


    // extend wallet client to support paymaster transactions
    const wClient = walletClient.extend(eip712WalletActions())

    //!!! Workaround to make paymaster transactions work on mobile
    const txReq = await wClient.prepareTransactionRequest({
      account: address,
      to: toAddress,
      value: ETH_AMOUNT,
      chain: zkSync,
      gas: BigInt(pmData.gasLimit),
      gasPerPubdata: BigInt(pmData.txData.customData.gasPerPubdata),
      maxFeePerGas: BigInt(pmData.txData.maxFeePerGas),
      maxPriorityFeePerGas: 0n,
      data: pmData.txData.data,
      paymaster: pmData.txData.customData.paymasterParams.paymaster,
      paymasterInput: pmData.txData.customData.paymasterParams.paymasterInput,
    })

    // const hash = await wClient.sendTransaction(txReq)
    const signature = await wClient.signTransaction(txReq)
    const hash = await customClient.sendRawTransaction({ serializedTransaction: signature })

    // update display
    setTxHash(hash)
  }

  // page content
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-800 text-gray-300">
      <ConnectButton />
      <div className='flex-col justify-center text-center item-center'>
        <input
          type="text"
          placeholder="Enter Ethereum address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value as Address)}
          className={isValidEthereumAddress(toAddress) ? 'text-green-500' : 'text-red-500'}
        />
        {!isValidEthereumAddress(toAddress) ? <p className='text-red-500'>Enter a valid Ethereum address.</p> : <p className='text-green-500'>Address valid! You can send transaction</p>}
      </div>
      <div className='flex-col justify-center text-center item-center'>
        <button onClick={clickSendTransaction} disabled={!isValidEthereumAddress(toAddress)} className='bg-blue-500 p-4 rounded-full disabled:opacity-50 disabled:bg-gray-500'>Send Transaction</button>
        <p className='text-sm'>Clicking on &quot;Send Transaction&quot; should send {Number(ETH_AMOUNT)} wei of ETH to the selected address while paying gas in WBTC (0xBBeB516fb02a01611cBBE0453Fe3c580D7281011)</p>
        <p className='text-orange-400'> transaction hash will show if successfull : </p>
        {txHash ? (
          <Link href={`https://explorer.zksync.io/tx/${txHash}`} className="underline text-green-500" target='_blank' rel="noopener noreferrer">
            https://explorer.zksync.io/tx/${txHash}
          </Link>
        ) : (
          <p className='text-orange-400'>No transaction sent</p>
        )}
      </div>
    </main>
  );
}

// calls Zyfi's api and returns the data that should be added to transactions that use the paymaster
async function submitTxDataToAPI(url: string, data: any) {
  let result;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    result = await response.json();
    console.log('result', result);
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
  return result
}

// web3modal button to connect wallet
function ConnectButton() {
  return <w3m-button />
}