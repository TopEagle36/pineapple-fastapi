'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { erc20Abi } from 'viem';

// @mui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Unstable_Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import { Button, Card, Stack } from '@mui/material';

// components
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import { config } from 'src/config';
// ----------------------------------------------------------------------
import { contract } from '../../constant/contract';


export default function ChatPage() {
  const apiUrl = process.env.NEXT_PUBLIC_SEVER_URI;
  const amt_per_call = Number(process.env.NEXT_PUBLIC_AMOUNT_PER_CALL)
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentences, setSentences] = useState([]);
  const { address } = useAccount();
  const chainId = useChainId();
  const [pineappleAmt, setPineappleAmt] = useState(0);
  const fetchTokenBalance = useCallback(async () => {
    try {
      const data = await readContract(config, {
        address: contract[chainId].tokenAddr,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      setPineappleAmt(Number((Number(data) / 10 ** 18).toFixed(4)));
    } catch (e) {
      console.log('Error on fetching balance', e);
    }
  }, [address, chainId]);
  useEffect(() => {
    fetchTokenBalance();
  }, [address, chainId]);

  const handleKeyDown = (event) => {
    // Check if the pressed key is Enter
    if (event.key === 'Enter') {
      // If Shift is not pressed, prevent the default behavior (new line)
      if (!event.shiftKey) {
        event.preventDefault(); // Prevent new line
        handleSubmit(); // Call the submit function
      }
      // If Shift is pressed, allow new line (do nothing)
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    sentences.push('...');
    setSentences(sentences);
    try{
      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputValue, address, pineappleAmt }),
      });
      sentences.pop();
      // setSentences(sentences);
      const data = await res.json();
      console.log("come here to data?", data);
      if(data?.type === 'success'){
        sentences.push(data.message);
        setSentences(sentences);
      }else if(data?.type === 'limit reached'){
        const limitPerday = Math.floor(data.holding/amt_per_call);
        const usage = Math.floor(data.usage/amt_per_call);
        sentences.push(`You've reached ${usage}/${limitPerday} daily limit of usage. Please fund more Pineapple token or try one day after!`);
        setSentences(sentences);
      }else{
        sentences.push(`You've reached daily limit of usage. Please fund more Pineapple token or try one day after!`);
        setSentences(sentences);
      }
      setLoading(false);
    }catch(e){
      console.log("error fetching", e);
      sentences.pop();
      sentences.push(`Server Error. Maybe Problem with Chat GPT Api key!`);
      setLoading(false);
    }
    
  };

  const handleSubmit = () => {
    if (pineappleAmt < amt_per_call) {
      enqueueSnackbar(
        "You don't have enough Pineapple token in your wallet. Please purchase some Pineapple to use!",
        { variant: 'error' }
      );
      return;
    }
    setInputValue('');
    sentences.push(inputValue);
    setSentences(sentences);
    fetchPosts();
  };
  const renderSentences = () =>(
      <Box sx={{ marginBottom: 3 }}>
        {sentences.map((sentence, index) => (
          <Stack key={index} alignItems={(index + 1) % 2 === 1 && 'flex-end'}>
            <Card
              key={index}
              // fullWidth
              sx={{
                maxWidth: (index + 1) % 2 === 1 ? 300 : 'auto', // Set your desired max width
                padding: 1, // Add some margin for spacing
                margin: 1,
                width: 'auto',
                whiteSpace: 'normal',
                overflow: 'hidden',
                wordWrap: 'break-word',
              }}
            >
              {sentence}
            </Card>
          </Stack>
        ))}
      </Box>
    );
  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* <Typography variant="h4"> Page One </Typography> */}
      {renderSentences()}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 10, sm: 20, md: 50 }, // Add space from the bottom
          left: { xs: 10, sm: 20, md: 200 }, // Left space for mobile and larger screens
          right: { xs: 10, sm: 20, md: 200 },
          // padding: '10px', // Optional: padding
          // boxShadow: '0 -2px 5px rgba(0, 0, 0, 0.1)',
          // bgcolor: 'background.paper', // Optional: background color
          borderRadius: 30, // Optional: rounded corners
        }}
      >
        <TextField
          variant="filled"
          // variant="outlined"
          fullWidth
          multiline
          disabled={loading}
          placeholder="What you want to know?"
          label="Message to ask!"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <CircularProgress
            size={24}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: -12,
              marginLeft: -12,
            }}
          />
        )}
      </Box>
    </Container>
  );
}
