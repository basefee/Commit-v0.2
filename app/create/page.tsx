'use client'

import { useState } from "react"
import { Formik, Field, Form, ErrorMessage } from "formik"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { waitForTransactionReceipt } from "@wagmi/core"
import * as Yup from "yup"
import axios from "axios"
import { parseUnits } from "viem"
import { config } from "../../wagmi"
import abi from "../../contract/abi.json"
import usdcABI from "../../contract/usdcabi.json"

const CommitSchema = Yup.object().shape({
  oneLiner: Yup.string().required("Required"),
  description: Yup.string().required("Required"),
  resolutionRules: Yup.string().required("Required"),
  joiningDeadline: Yup.date().required("Required"),
  fulfillmentDeadline: Yup.date().required("Required"),
  creatorFee: Yup.number().required("Required"),
  commitStake: Yup.number().required("Required"),
  joinFee: Yup.number().required("Required"),
  creatorShare: Yup.number().required("Required").min(0).max(100),
  token: Yup.string().required("Required"),
})

const usdcContractAddress = "0xd9894F40cC8533F0e2529d8d3324F361947521a4"
const commitContractAddress = "0x15ef602D45B42c63402af795bD2A96742ee936a7"

export default function CreateCommitPage() {
  const { address, isConnected } = useAccount()
  const [message, setMessage] = useState("")

  const { writeContractAsync } = useWriteContract()

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcContractAddress,
    abi: usdcABI,
    functionName: "allowance",
    args: [address, commitContractAddress],
  })

  const handleCreateCommit = async (values: any) => {
    if (!isConnected || !address) {
      setMessage("Please connect your wallet before creating a commitment.")
      return
    }

    const amountToApproveBI = parseUnits(values.commitStake.toString(), 6)

    try {
      const allowanceBI = 
        allowance && (typeof allowance === 'string' || typeof allowance === 'number' || typeof allowance === 'bigint')
          ? BigInt(allowance)
          : BigInt(0)

      if (allowanceBI < amountToApproveBI) {
        setMessage(`Approving ${values.commitStake} USDC for the commitment...`)

        const approveTx = await writeContractAsync({
          address: usdcContractAddress,
          abi: usdcABI,
          functionName: "approve",
          args: [commitContractAddress, amountToApproveBI],
        })

        await waitForTransactionReceipt(config, { hash: approveTx })
        setMessage("USDC approved! Creating the commitment...")
        await refetchAllowance()
      } else {
        setMessage("USDC is already approved. Creating the commitment...")
      }

      const createTx = await writeContractAsync({
        address: commitContractAddress,
        abi: abi,
        functionName: "createCommitment",
        args: [
          values.token,
          parseUnits(values.commitStake.toString(), 10**18),
          parseUnits(values.joinFee.toString(), 10**18),
          BigInt(Math.floor(values.creatorShare * 100)),
          values.oneLiner,
          BigInt(Math.floor(new Date(values.joiningDeadline).getTime() / 1000)),
          BigInt(Math.floor(new Date(values.fulfillmentDeadline).getTime() / 1000)),
          address,
        ],
        overrides: {
          value: BigInt(Math.floor(0.001 * 1e18))
        }
      } as any);

      const receipt = await waitForTransactionReceipt(config, { hash: createTx })

    } catch (error) {
      console.error("Error during commitment creation:", error)
      setMessage("An error occurred during the commitment creation process.")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white">
      <h1 className="text-4xl font-semibold mb-8">Create a New Commitment</h1>
      
      <Formik
        initialValues={{
          oneLiner: "",
          description: "",
          resolutionRules: "",
          joiningDeadline: "",
          fulfillmentDeadline: "",
          creatorFee: 1,
          commitStake: 10,
          joinFee: 0.5,
          creatorShare: 5,
          token: usdcContractAddress,
        }}
        validationSchema={CommitSchema}
        onSubmit={handleCreateCommit}
      >
        {({ isSubmitting }) => (
          <Form className="w-full max-w-md space-y-6">
            <div>
              <label className="block text-lg mb-2">One-Liner</label>
              <Field name="oneLiner" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" placeholder="Short description" />
              <ErrorMessage name="oneLiner" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Description</label>
              <Field name="description" component="textarea" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" placeholder="Detailed description" />
              <ErrorMessage name="description" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Resolution Rules</label>
              <Field name="resolutionRules" component="textarea" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" placeholder="Rules for resolution" />
              <ErrorMessage name="resolutionRules" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Joining Deadline</label>
              <Field name="joiningDeadline" type="datetime-local" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="joiningDeadline" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Fulfillment Deadline</label>
              <Field name="fulfillmentDeadline" type="datetime-local" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="fulfillmentDeadline" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Creator Fee</label>
              <Field name="creatorFee" type="number" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="creatorFee" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Commit Stake</label>
              <Field name="commitStake" type="number" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="commitStake" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Join Fee</label>
              <Field name="joinFee" type="number" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="joinFee" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Creator Share (%)</label>
              <Field name="creatorShare" type="number" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="creatorShare" component="div" className="text-red-500" />
            </div>

            <div>
              <label>Token</label>
              <Field as="select" name="token" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500">
                <option value={usdcContractAddress}>USDC</option>
              </Field>
              <ErrorMessage name="token" component="div" className="text-red-500" />
            </div>

            <button type="submit" className="w-full p-3 mt-4 bg-green-500 text-white font-semibold rounded hover:bg-green-600 focus:outline-none" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Commitment"}
            </button>
          </Form>
        )}
      </Formik>

      {message && (
        <div className="mt-4 p-4 bg-gray-700 text-white rounded-lg">
          {message}
        </div>
      )}
    </div>
  )
}