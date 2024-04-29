import { privateKeyToAddress, generatePrivateKey, signMessage } from 'viem/accounts';

const generateSignature = async () => {
  const privateKey = generatePrivateKey();
  const signature = await signMessage({
    message:
      'By signing this message, I confirm my intention to use ContractWatch and agree to the associated terms and conditions.',
    privateKey: privateKey,
  });

  return { address: privateKeyToAddress(privateKey), signature };
};

const main = async () => {
  const [, , command] = process.argv;
  if (command === 'generate-signature') {
    const { signature, address } = await generateSignature();
    console.log('Address:', address);
    console.log('Signature:', signature);
    process.exit(0);
  } else {
    console.log('Invalid command. Usage: pnpm tools <command>');
    console.log('Available commands:');
    console.log('  generate-signature');
    process.exit(1);
  }
};

main();
