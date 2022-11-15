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
  const contractAddress = "0xD7bf1Ceb5adC3D975dad1bf131aEb229606f0234";
  const contractABI = abi.abi;
  // set/get authorized MetaMask account
  const [currentAccount, setCurrentAccount] = useState("");
  // set/get wave data
  const [allWaves, setAllWaves] = useState([]);
  // set/get user input from textbox
  const [userInput, setUserInput] = useState("");
  // set/get loading indicator
  const [loading, setLoading] = useState(false);
  
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

  // listen to textbox onChange event to get latest user input
  const onChange = (event) => {
    setUserInput(event.target.value);
  };

  // callback function for NewWave event listener in UseEffect()
  // accessing data from event (i.e. from, timestamp, message)
  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);

    // new data will be appended the allWaves array, UI will be updated
    // prevState contains previous state of data, i.e. it contains previous wave data
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  // listen for NewWave event
  useEffect(() => {
    let wavePortalContract;
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      // ethers.js - to listen to events, it will trigger callback function onNewWave when event is emitted
      wavePortalContract.on("NewWave", onNewWave);
    }

    // always make sure that if you're using some type of listener function,
    // put it in a useEffect and return a function for cleaning it up
    // otherwise component will re-render several hundred times when the event only happens once
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

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
        // make the user pay a set amount of gas of 300,000
        // if they don't use all of it in the transaction they'll automatically be refunded
        const waveTxn = await wavePortalContract.wave(userInput, { gasLimit: 300000 });
        setLoading(true); // enable loading indicator

        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setLoading(false); // disable loading indicator
      } 
      else {
        console.log("Ethereum object doesn't exist!");
      }
    }
    catch (error) {
      console.log(error);
    }
  };

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
  };
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          Hey👋 Bi-bimbap here.
        </div>

        <div className="bio">
        <p>I'm curious to learn more about Web3 and building my own apps :)</p>

        <p>Wave at me on the Ethereum blockchain! Maybe send a sweet message too?
           Connect your wallet, write your message, and then wave 👋.</p>
        </div>

        <textarea placeholder="Enter your message here :)" value={userInput} onChange={onChange}></textarea>

        {loading ? (
          <button disabled className="waveButton">Loading...</button>    
        ) : ( 
          <button className="waveButton" onClick={wave}>Wave at Me</button>
        )}

        {/*
        * if there is no currentAccount, render this btn
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
          Connect Wallet
          </button>
        )}

        <div className="dataContainer">
          <p className="text-4xl font-extrabold text-gray-800 py-4">Wave Log 👀</p>
          <p className="subheading">Check out all these people out here waving!</p>
          
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
    </div>
  );
}
