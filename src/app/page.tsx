"use client"
import React, { useState } from 'react';
import Link from "next/link";
import { Address } from 'viem';
import { eip712WalletActions } from 'viem/zksync'
import { zkSync } from 'viem/chains'
import { useWalletClient } from 'wagmi';

const TOKEN_TO_SEND = "0xBBeB516fb02a01611cBBE0453Fe3c580D7281011" //WBTC
const ETH_AMOUNT = 1000n; // amount of wei to send
const API_URL = 'https://api.zyfi.org/api/erc20_paymaster/v1'

export default function EthPage() {

  const [toAddress, setToAddress] = useState<Address>('0x'); // address to send ETH to
  const { data: walletClient } = useWalletClient();

  // Checks if an address is a valid Ethereum address
  function isValidEthereumAddress(toAddress: Address) {
    return /^0x[a-fA-F0-9]{40}$/.test(toAddress);
  }

  const clickSendTransaction = async () => {
    if (!walletClient) {
      alert('Please connect your wallet');
      return;
    }
    if (!isValidEthereumAddress(toAddress)) {
      alert('Invalid Ethereum address, please enter a valid Ethereum address.');
      return;
    }
    const address = walletClient.account.address

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

    const res = await submitTxDataToAPI(API_URL, txRequest)
    console.log('res', res)

    const paymaster = res.txData.customData.paymasterParams.paymaster
    const paymasterInput = res.txData.customData.paymasterParams.paymasterInput

    // extend wallet client to support paymaster transactions
    const wClient = walletClient.extend(eip712WalletActions())

    const txPayload = {
      account: address,
      to: toAddress,
      value: ETH_AMOUNT,
      chain: zkSync,
      gas: BigInt(res.gasLimit),
      gasPerPubdata: BigInt(res.txData.customData.gasPerPubdata),
      maxFeePerGas: BigInt(res.txData.maxFeePerGas),
      maxPriorityFeePerGas: 0n,
      data: res.txData.data,
      paymaster,
      paymasterInput
    }
    console.log('tranasaction payload: ', txPayload)

    try {
      const hash = await wClient.sendTransaction(txPayload)
      console.log('hash:', hash)
      console.log('check it on zksync explorer:', `https://explorer.zksync.io/tx/${hash}`)
    }
    catch (e) {
      console.log('error', e)
    }
  }

  const clickSignMessage = async () => {
    if (!walletClient) {
      alert('Please connect your wallet');
      return;
    }

    const signature = await walletClient.signMessage({ message: "hello" })
    console.log('signature of "hello" : ', signature)
  }

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
      </div>
      <div className='flex-col justify-center text-center item-center'>
        <button onClick={clickSignMessage} disabled={!walletClient} className='bg-blue-500 p-4 rounded-full disabled:opacity-50 disabled:bg-gray-500'>Sign Message</button>
        <p className='text-sm'>button to verify simple signatures work</p>
      </div>
    </main>
  );
}

function ConnectButton() {
  return <w3m-button />
}

// calls Zyfi's api annd returns the data that should be added to transactions that use the paymaster
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