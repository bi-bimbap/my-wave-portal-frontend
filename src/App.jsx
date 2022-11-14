import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json'

// If we're logged in to Metamask, it will automatically inject a special object named ethereum into our window
const getEthereumObject = () => window.ethereum;

// const findMetaMaskAccount = async () => {
//     try {
//       const ethereum = getEthereumObject();

//       // first make sure we have access to the ethereum object
//       if (!ethereum) {
//         console.error("Make sure you have Metamask");
//         return null;
//       }

//       console.log("We have the Ethereum object", ethereum);

//       // use special method eth_accounts to see if we're authorized to access any of the accounts in the user's wallet
//       // returns a list of addresses owned by user
//       const accounts = await ethereum.request({method: "eth_accounts"});

//       if (accounts.length !== 0) {
//         // user could have multiple accounts in their wallet. In this case, we just grab the first one
//         const account = accounts[0];
//         console.log("Found an authorized account: ", account);
//         return account;
//       }
//       else {
//         console.error("No authorized account found");
//         return null;
//       }
//     }
//     catch(error) {
//       console.error(error);
//       return null;
//     }
//   };

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [userInput, setUserInput] = useState("");
  const contractAddress = "0x96831450081E01B5F4fB5D95D49493910c37B5d9";
  const contractABI = abi.abi;
  
  /*
   * The passed callback function will be run when the page loads.
   * More technically, when the App component "mounts".
   */
  // see if we can access the users account
  // useEffect(() => {
  //   const ethereum = getEthereumObject();
    
  //   if (!ethereum) {
  //     console.log("Make sure you have metamask!");
  //   } 
  //   else {
  //     console.log("We have the ethereum object", ethereum);
  //   }
  // }, []);
  // useEffect(async () => {
    // const account = await findMetaMaskAccount();

    // if (account !== null) {
    //   setCurrentAccount(account);
    // }
  // }, []);

  const onChange = (event) => {
    setUserInput(event.target.value);
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const checkIfWalletIsConnected = async () => {
    try {
      const ethereum = getEthereumObject();

      // first make sure we have access to the ethereum object
      if (!ethereum) {
        console.error("Make sure you have Metamask");
        return;
      }

      console.log("We have the Ethereum object", ethereum);

      // use special method eth_accounts to see if we're authorized to access any of the accounts in the user's wallet
      // returns a list of addresses owned by user
      const accounts = await ethereum.request({method: "eth_accounts"});

      if (accounts.length !== 0) {
        // user could have multiple accounts in their wallet. In this case, we just grab the first one
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
        getAllWaves();
      }
      else {
        console.error("No authorized account found");
      }
    }
    catch(error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // ask Metamask to give me access to the user's wallet
      // this request causes a MetaMask popup to appear.
      const accounts = await ethereum.request({method: "eth_requestAccounts"});

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    }
    catch (error) {
      console.error(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        // object that represents an Ethereum account
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        // execute wave() from contract
        const waveTxn = await wavePortalContract.wave(userInput, { gasLimit: 300000 });

        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } 
      else {
        console.log("Ethereum object doesn't exist!");
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        // object that represents an Ethereum account
        const signer = provider.getSigner();
        // connect to smart contract
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        // we only need address, timestamp, and message in our UI so let's pick those out
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        // store data in React State
        setAllWaves(wavesCleaned);
      }
      else {
        console.log("Ethereum object doesn't exist!");
      }
    }
    catch (error) {
      console.log("error");
    }
  }

  // let listenToNewWaveEvent = async () => {
  //   try {
  //     const { ethereum } = window;

  //     if (ethereum) {
  //       const provider = new ethers.providers.Web3Provider(ethereum);
  //       // object that represents an Ethereum account
  //       const signer = provider.getSigner();
  //       // connect to smart contract
  //       const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

  //       wavePortalContract.on("NewWave", async (from, timestamp, message, event)) => {
  //         getAllWaves();
  //       });
  //     } 
  //     else {
  //       console.log("Ethereum object doesn't exist!");
  //     }
  //   } 
  //   catch (error) {
  //     console.log(error);
  //   }
  // };
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hello there!
        </div>

        <div className="bio">
        Bi-bimbap here~ I'm curious to learn more about Web3 and building my own apps :)
        </div>

        <input type="text" value={userInput} onChange={onChange}></input>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {/*
        * if there is no currentAccount, render this btn
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
          Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
