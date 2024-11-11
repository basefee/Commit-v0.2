// pages/api/createCommit.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { commitId, oneLiner, description, resolutionRules, creatorFee, commitStake, joiningDeadline, fulfillmentDeadline } = req.body;
    try {
      const newCommit = await prisma.commit.create({
        data: {
          commitId,
          oneLiner,
          description,
          resolutionRules,
          creatorFee,
          commitStake,
          joiningDeadline: new Date(joiningDeadline),
          fulfillmentDeadline: new Date(fulfillmentDeadline),
        },
      });
      res.status(200).json(newCommit);
    } catch (error) {
      res.status(500).json({ error: "Error creating commit" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
