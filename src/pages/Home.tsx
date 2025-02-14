import { Button, TextField, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { useEffect, useState } from "react";

export default function Home() {
  const { walletInterface, accountId } = useWalletInterface();
  const [topicMemo, setTopicMemo] = useState("");
  const [createdTopicId, setCreatedTopicId] = useState("");
  const [topicIdForMessage, setTopicIdForMessage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (createdTopicId) {
      setTopicIdForMessage(createdTopicId);
    }
  }, [createdTopicId]);

  return (
    <Stack alignItems="center" spacing={4}>
      <Typography variant="h4" color="white">
        Let's build a dApp on Hedera!
      </Typography>
      {walletInterface !== null && accountId && (
        <Stack spacing={3}>
          <Stack direction="row" gap={2} alignItems="center">
            <Typography>Create a Topic</Typography>
            <TextField
              label="Topic Memo"
              value={topicMemo}
              onChange={(e) => setTopicMemo(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              onClick={async () => {
                if (!topicMemo) return;
                const txId = await walletInterface.createTopic(topicMemo);
                if (txId) {
                  setCreatedTopicId("0.0.xxxx");
                }
              }}
            >
              Create
            </Button>
          </Stack>
          <Stack direction="row" gap={2} alignItems="center">
            <Typography>Submit a Message</Typography>
            <TextField
              label="Topic ID"
              value={topicIdForMessage}
              onChange={(e) => setTopicIdForMessage(e.target.value)}
              size="small"
            />
            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              onClick={async () => {
                if (!topicIdForMessage || !message) return;
                const txId = await walletInterface.submitMessage(topicIdForMessage, message);
                if (txId) {
                  console.log("Message submitted:", txId);
                }
              }}
            >
              Submit
            </Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
