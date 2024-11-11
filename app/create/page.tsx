"use client";

import { useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import axios from "axios";
import * as Yup from "yup";
import abi from "../../contract/abi.json"

const CommitSchema = Yup.object().shape({
  oneLiner: Yup.string().required("Required"),
  description: Yup.string().required("Required"),
  resolutionRules: Yup.string().required("Required"),
  joiningDeadline: Yup.date().required("Required"),
  fulfillmentDeadline: Yup.date().required("Required"),
  creatorFee: Yup.number().required("Required"),
  commitStake: Yup.number().required("Required"),
  token: Yup.string().required("Required"),
});

const contractABI = abi;
const contractAddress = "0x15ef602D45B42c63402af795bD2A96742ee936a7";

export default function CreateCommitPage() {
  const { isConnected } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContract, data: writeData, error: writeError, isPending: isWritePending } = useWriteContract()

  const { isLoading: txLoading, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const saveCommitToPrisma = async (commitId: number, values: any) => {
    const { oneLiner, description, resolutionRules, creatorFee, commitStake, joiningDeadline, fulfillmentDeadline } = values
    try {
      await axios.post("/api/createCommit", { 
        commitId, 
        oneLiner, 
        description, 
        resolutionRules, 
        creatorFee, 
        commitStake, 
        joiningDeadline, 
        fulfillmentDeadline 
      })
    } catch (error) {
      console.error("Failed to save commit to database:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white">
      <h1 className="text-4xl font-semibold mb-8">Commit to Something</h1>
      
      <Formik
        initialValues={{
          oneLiner: "",
          description: "",
          resolutionRules: "",
          joiningDeadline: "",
          fulfillmentDeadline: "",
          creatorFee: 1,
          commitStake: 10,
          token: "USDC",
        }}
        validationSchema={CommitSchema}
        onSubmit={async (values, { setSubmitting }) => {
          if (!isConnected) {
            alert("Please connect your wallet first")
            setSubmitting(false)
            return
          }

          try { // Modify this later
            const result = await writeContract({
              address: contractAddress,
              abi: contractABI,
              functionName: 'createCommitment',
              args: [
                values.oneLiner,
                values.description,
                values.resolutionRules,
                BigInt(Math.floor(new Date(values.joiningDeadline).getTime() / 1000)),
                BigInt(Math.floor(new Date(values.fulfillmentDeadline).getTime() / 1000)),
                BigInt(Math.floor(values.creatorFee * 100)),
                BigInt(Math.floor(values.commitStake * 1e18)),
                values.token
              ],
            })

            if (result) {
              setTxHash(result)
            }
          } catch (error) {
            console.error("Failed to send transaction", error)
            alert("Failed to send transaction. Please try again.")
          }
          
          setSubmitting(false)
        }}
      >
        {({ isSubmitting }) => (
          <Form className="w-full max-w-md space-y-6">
            <div>
              <label className="block text-lg mb-2">One-Liner</label>
              <Field name="oneLiner" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" placeholder="Short description" />
              <ErrorMessage name="oneLiner" component="div" className="error" />
            </div>

            <div>
              <label>Description</label>
              <Field name="description" component="textarea" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" placeholder="Detailed description" />
              <ErrorMessage name="description" component="div" className="error" />
            </div>

            <div>
              <label>Resolution Rules</label>
              <Field name="resolutionRules" component="textarea" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" placeholder="Rules for resolution" />
              <ErrorMessage name="resolutionRules" component="div" className="error" />
            </div>

            <div>
              <label>Joining Deadline</label>
              <Field name="joiningDeadline" type="datetime-local" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="joiningDeadline" component="div" className="error" />
            </div>

            <div>
              <label>Fulfillment Deadline</label>
              <Field name="fulfillmentDeadline" type="datetime-local" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="fulfillmentDeadline" component="div" className="error" />
            </div>

            <div>
              <label>Creator Fee</label>
              <Field name="creatorFee" type="number" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="creatorFee" component="div" className="error" />
            </div>

            <div>
              <label>Commit Stake</label>
              <Field name="commitStake" type="number" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500" />
              <ErrorMessage name="commitStake" component="div" className="error" />
            </div>

            <div>
              <label>Token</label>
              <Field as="select" name="token" className="input w-full p-3 rounded bg-zinc-800 text-white placeholder-gray-500 border border-zinc-800 focus:outline-none focus:border-green-500">
                <option value="USDC">USDC</option>
                <option value="DAI">DAI</option>
                <option value="ETH">ETH</option>
              </Field>
              <ErrorMessage name="token" component="div" className="error" />
            </div>

            <button type="submit" className="button w-full p-3 mt-4 bg-green-500 text-white font-semibold rounded hover:bg-green-600 focus:outline-none" disabled={isSubmitting || isWritePending || txLoading}>
              {isSubmitting || isWritePending || txLoading ? "Processing..." : "Commit"}
            </button>

            {writeError && (
              <div className="error-message">
                Error: {writeError.message || "Failed to create commit. Please try again."}
              </div>
            )}

            {txSuccess && (
              <div className="success-message">
                Commit created successfully! Transaction hash: {txHash}
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  )
}
