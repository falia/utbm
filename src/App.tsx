import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import ImageUploader from './Image';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';


const client = generateClient<Schema>();

function App() {

  const { signOut } = useAuthenticator();

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Alzheimer Diagnosis
            </Typography>
            <Button onClick={signOut} color="inherit">Sign out</Button>
          </Toolbar>
        </AppBar>
      </Box>

      <main>
        <Container maxWidth="lg">
          <Box sx={{ height: '100vh' }} >
            <ImageUploader></ImageUploader>
          </Box>
        </Container>
      </main>
    </div>



  );
}

export default App;
