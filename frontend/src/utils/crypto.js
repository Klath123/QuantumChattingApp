// Enhanced Post-Quantum Cryptography Module with Dilithium Signing
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { randomBytes } from '@noble/post-quantum/utils';

export function base64ToUint8Array(base64) {
  try {
    // Add validation and debugging
    console.log("🔍 Converting Base64 to Uint8Array:");
    console.log("  Input:", base64);
    console.log("  Type:", typeof base64);
    console.log("  Length:", base64?.length);
    
    if (!base64) {
      throw new Error("Base64 string is null or undefined");
    }
    
    if (typeof base64 !== 'string') {
      throw new Error(`Expected string, got ${typeof base64}`);
    }
    
    // Remove any whitespace that might cause issues
    const cleanBase64 = base64.trim();
    
    if (cleanBase64.length === 0) {
      throw new Error("Base64 string is empty");
    }
    
    // Check for valid Base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      throw new Error("Invalid Base64 characters detected");
    }
    
    const uint8 = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
    console.log("✅ base64ToUint8Array successful, length:", uint8.length);
    return uint8;
  } catch (error) {
    console.error("❌ base64ToUint8Array failed:", error);
    console.error("❌ Input was:", base64);
    throw error;
  }
}

export function uint8ArrayToBase64(bytes) {
  try {
    console.log("🔍 Converting Uint8Array to Base64:");
    console.log("  Input:", bytes);
    console.log("  Type:", typeof bytes);
    console.log("  Is Uint8Array:", bytes instanceof Uint8Array);
    console.log("  Length:", bytes?.length);
    
    if (!bytes) {
      throw new Error("Bytes array is null or undefined");
    }
    
    if (!(bytes instanceof Uint8Array)) {
      throw new Error(`Expected Uint8Array, got ${typeof bytes}`);
    }
    
    if (bytes.length === 0) {
      throw new Error("Uint8Array is empty");
    }
    
    const base64 = btoa(String.fromCharCode(...bytes));
    console.log("✅ uint8ArrayToBase64 successful, length:", base64.length);
    return base64;
  } catch (error) {
    console.error("❌ uint8ArrayToBase64 failed:", error);
    throw error;
  }
}

export async function aesGcmEncrypt(key, plaintext) {
  try {
    const iv = randomBytes(12);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      'AES-GCM',
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      new TextEncoder().encode(plaintext)
    );

    console.log("✅ AES-GCM Encryption successful");
    return {
      ciphertext: new Uint8Array(encrypted),
      iv,
    };
  } catch (error) {
    console.error("❌ AES-GCM Encryption failed:", error);
    throw error;
  }
}

export async function aesGcmDecrypt(key, ciphertext, iv) {
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      'AES-GCM',
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    console.log("✅ AES-GCM Decryption successful");
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("❌ AES-GCM Decryption failed:", error);
    throw error;
  }
}

// Dilithium signing functions
export function signMessage(message, dilithiumPrivateKeyBase64) {
  try {
    console.log("✍️ Signing message with Dilithium...");
    console.log("✍️ Message:", message);
    console.log("✍️ Private key length:", dilithiumPrivateKeyBase64?.length);

    // Convert base64 private key to Uint8Array
    const privateKey = base64ToUint8Array(dilithiumPrivateKeyBase64);
    
    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message);
    console.log("✍️ Message bytes length:", messageBytes.length);
    
    // Sign the message
    const signature = ml_dsa65.sign(privateKey, messageBytes);
    console.log("✍️ Signature generated, length:", signature.length);
    
    // Convert signature to base64 for transmission
    const signatureBase64 = uint8ArrayToBase64(signature);
    console.log("✅ Message signed successfully");
    
    return signatureBase64;
  } catch (error) {
    console.error("❌ Message signing failed:", error);
    throw error;
  }
}

export function verifySignature(message, signatureBase64, dilithiumPublicKeyBase64) {
  try {
    console.log("🔍 Verifying signature with Dilithium...");
    console.log("🔍 Message:", message);
    console.log("🔍 Signature length:", signatureBase64?.length);
    console.log("🔍 Public key length:", dilithiumPublicKeyBase64?.length);

    // Convert base64 inputs to Uint8Array
    const publicKey = base64ToUint8Array(dilithiumPublicKeyBase64);
    const signature = base64ToUint8Array(signatureBase64);
    
    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message);
    console.log("🔍 Message bytes length:", messageBytes.length);
    
    // Verify the signature
    const isValid = ml_dsa65.verify(publicKey, messageBytes, signature);
    console.log("🔍 Signature verification result:", isValid);
    
    if (isValid) {
      console.log("✅ Signature is valid");
    } else {
      console.log("❌ Signature is invalid");
    }
    
    return isValid;
  } catch (error) {
    console.error("❌ Signature verification failed:", error);
    throw error;
  }
}

// Enhanced encryption with signing
export async function encryptAndSignMessage(peerPublicKeyBase64, message, dilithiumPrivateKeyBase64) {
  try {
    console.log("🔐✍️ Starting message encryption and signing...");
    console.log("🔐✍️ Peer public key:", peerPublicKeyBase64);
    console.log("🔐✍️ Message:", message);

    // First, encrypt the message
    const encryptionResult = await encryptMessage(peerPublicKeyBase64, message);
    console.log("🔐 Message encrypted successfully");

    // Then, sign the original message
    const signature = signMessage(message, dilithiumPrivateKeyBase64);
    console.log("✍️ Message signed successfully");

    // Return combined result
    const result = {
      ...encryptionResult,
      signature,
    };
    
    console.log("✅ Message encryption and signing completed");
    return result;
  } catch (error) {
    console.error("❌ encryptAndSignMessage failed:", error);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
}

// Enhanced decryption with signature verification
export async function decryptAndVerifyMessage({
  kyberPrivateKeyBase64,
  kyberCiphertextBase64,
  encryptedMessageBase64,
  ivBase64,
  signature,
  dilithiumPublicKeyBase64,
}) {
  try {
    console.log("🔓🔍 Decrypting and verifying message...");

    // First, decrypt the message
    const plaintext = await decryptMessage({
      kyberPrivateKeyBase64,
      kyberCiphertextBase64,
      encryptedMessageBase64,
      ivBase64,
    });
    console.log("🔓 Message decrypted successfully");

    // Then, verify the signature
    const isSignatureValid = verifySignature(plaintext, signature, dilithiumPublicKeyBase64);
    console.log("🔍 Signature verification completed");

    if (!isSignatureValid) {
      throw new Error("Message signature verification failed - message may have been tampered with");
    }

    console.log("✅ Message decrypted and signature verified successfully");
    return {
      message: plaintext,
      signatureValid: isSignatureValid,
    };
  } catch (error) {
    console.error("❌ decryptAndVerifyMessage failed:", error);
    throw error;
  }
}

export async function encryptMessage(peerPublicKeyBase64, message) {
  try {
    console.log("🔐 Starting message encryption...");
    console.log("🔐 Peer public key:", peerPublicKeyBase64);
    console.log("🔐 Message:", message);

    // Convert Base64-encoded peer public key to Uint8Array
    const peerPublicKey = base64ToUint8Array(peerPublicKeyBase64);
    console.log("🔐 Peer public key converted, length:", peerPublicKey.length);

    // Encapsulate to get ciphertext and shared secret
    console.log("🔐 Starting Kyber encapsulation...");
    const encapsulationResult = ml_kem768.encapsulate(peerPublicKey);
    
    // Debug the encapsulation result structure
    console.log("🔍 Encapsulation result:", encapsulationResult);
    console.log("🔍 Encapsulation result keys:", Object.keys(encapsulationResult));
    
    // Handle different possible return structures
    let kyberCiphertext, sharedSecret;
    
    // Check for the actual property names returned by @noble/post-quantum
    if (encapsulationResult.cipherText && encapsulationResult.sharedSecret) {
      // Structure: { cipherText, sharedSecret } - note the capital T in cipherText
      kyberCiphertext = encapsulationResult.cipherText;
      sharedSecret = encapsulationResult.sharedSecret;
    } else if (encapsulationResult.ciphertext && encapsulationResult.sharedSecret) {
      // Alternative structure: { ciphertext, sharedSecret } - lowercase t
      kyberCiphertext = encapsulationResult.ciphertext;
      sharedSecret = encapsulationResult.sharedSecret;
    } else if (encapsulationResult.ct && encapsulationResult.ss) {
      // Alternative structure: { ct, ss }
      kyberCiphertext = encapsulationResult.ct;
      sharedSecret = encapsulationResult.ss;
    } else if (Array.isArray(encapsulationResult) && encapsulationResult.length === 2) {
      // Array structure: [ciphertext, sharedSecret]
      kyberCiphertext = encapsulationResult[0];
      sharedSecret = encapsulationResult[1];
    } else {
      console.error("❌ Unknown encapsulation result structure:", encapsulationResult);
      console.error("❌ Available keys:", Object.keys(encapsulationResult));
      throw new Error("Unknown encapsulation result structure");
    }
    
    console.log("🔐 Kyber ciphertext:", kyberCiphertext);
    console.log("🔐 Shared secret:", sharedSecret);
    console.log("🔐 Kyber ciphertext type:", typeof kyberCiphertext);
    console.log("🔐 Kyber ciphertext length:", kyberCiphertext?.length);
    console.log("🔐 Shared secret type:", typeof sharedSecret);
    console.log("🔐 Shared secret length:", sharedSecret?.length);
    
    if (!kyberCiphertext) {
      throw new Error("Kyber ciphertext is null or undefined");
    }
    
    if (!sharedSecret) {
      throw new Error("Shared secret is null or undefined");
    }
    
    console.log("✅ Kyber encapsulation done");

    // Encrypt the actual message using AES-GCM and the shared secret
    console.log("🔐 Starting AES-GCM encryption...");
    const { ciphertext: encryptedMessage, iv } = await aesGcmEncrypt(sharedSecret, message);
    console.log("🔐 AES-GCM result - encrypted message:", encryptedMessage);
    console.log("🔐 AES-GCM result - iv:", iv);

    // Convert all binary outputs to Base64 for sending over the network
    console.log("🔐 Converting to Base64...");
    const result = {
      kyberCiphertext: uint8ArrayToBase64(kyberCiphertext),
      encryptedMessage: uint8ArrayToBase64(encryptedMessage),
      iv: uint8ArrayToBase64(iv),
    };
    
    console.log("✅ Message encryption completed");
    return result;
  } catch (error) {
    console.error("❌ encryptMessage failed:", error);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
}

export async function decryptMessage({
  kyberPrivateKeyBase64,
  kyberCiphertextBase64,
  encryptedMessageBase64,
  ivBase64,
}) {
  try {
    console.log("🔓 Decrypting message...");

    // Decode base64 inputs to Uint8Array
    const privateKey = base64ToUint8Array(kyberPrivateKeyBase64);
    const ciphertext = base64ToUint8Array(kyberCiphertextBase64);
    const encryptedMessage = base64ToUint8Array(encryptedMessageBase64);
    const iv = base64ToUint8Array(ivBase64);

    // Recover the shared secret using Kyber decapsulation
    const sharedSecret = ml_kem768.decapsulate(ciphertext, privateKey);
    console.log("✅ Kyber decapsulation done");

    // Decrypt the AES-GCM encrypted message
    const plaintext = await aesGcmDecrypt(sharedSecret, encryptedMessage, iv);
    console.log("✅ Message decrypted:", plaintext);

    return plaintext;
  } catch (error) {
    console.error("❌ decryptMessage failed:", error);
    throw error;
  }
}

export async function generateAndReturnPQKeys() {
  try {
    console.log("🔑 Generating PQ keys...");
    const kyber = ml_kem768.keygen();
    const dilithium = ml_dsa65.keygen();

    console.log("✅ Kyber Public Key:", kyber.publicKey);
    console.log("✅ Kyber Private Key:", kyber.secretKey);
    console.log("✅ Dilithium Public Key:", dilithium.publicKey);
    console.log("✅ Dilithium Private Key:", dilithium.secretKey);

    return {
      kyber: {
        publicKey: uint8ArrayToBase64(kyber.publicKey),
        privateKey: uint8ArrayToBase64(kyber.secretKey),
      },
      dilithium: {
        publicKey: uint8ArrayToBase64(dilithium.publicKey),
        privateKey: uint8ArrayToBase64(dilithium.secretKey),
      },
    };
  } catch (err) {
    console.error("🔐 Key generation failed:", err);
    throw new Error("Failed to generate post-quantum keys");
  }
}