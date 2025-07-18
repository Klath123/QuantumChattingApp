# Post-Quantum Secure Chat App

Ever wondered what happens to your "secure" messages when quantum computers become powerful enough to break today's encryption? This project tackles that exact problem. It's a real-time chat application built from the ground up to be secure not just today, but in the post-quantum future.

At its heart, this app swaps out vulnerable cryptographic methods for powerful, NIST-standardized algorithms that can withstand attacks from both classical and quantum computers. It's a practical demonstration that we can build quantum-safe tools without sacrificing the snappy, real-time experience we expect from modern messaging apps.

***

### Key Features 🔐

* **Quantum-Resistant Security**: Uses **CRYSTALS-Kyber** for secure key exchange and **CRYSTALS-Dilithium** for digital signatures to authenticate messages.
* **End-to-End Encryption**: Your messages are encrypted on your device and can only be decrypted by the person you're talking to. The server only sees encrypted gibberish.
* **Real-Time Chat**: Enjoy instant messaging, see who's online, and access your chat history, all powered by a low-latency WebSocket connection.
* **Strong Authentication**: Security is layered with email-based OTP verification and robust session management using JWTs.

***

### The Tech Stack 💻

This application is built with a modern and powerful set of tools:

The frontend is a responsive **React.js** single-page application, making the user experience smooth and interactive. For the backend, we used **FastAPI**, a high-performance Python framework, to handle API requests and manage WebSocket connections for real-time communication. All data, including user profiles and encrypted messages, is stored in a flexible **MongoDB** NoSQL database.

The cryptographic magic happens thanks to the `noble/post-quantum` library, which provides the JavaScript implementation of Kyber and Dilithium.

***

### How It Works: The Secure Flow

The app's architecture is designed with security and privacy as the top priority. Everything is built to ensure that only you and the person you are chatting with can read your messages.

1.  **Registration & Key Generation**: When you sign up, your browser generates a unique set of post-quantum keys (Kyber and Dilithium). Your private keys never leave your device; they are stored securely in your browser's local storage. Only your public keys are uploaded to the server for others to find you.

2.  **Sending a Message**:
    * First, your app fetches the recipient's **Kyber public key** from the server.
    * It then uses this key to create a unique shared secret that only you and the recipient can know. This process is called key encapsulation.
    * Your message is encrypted using a strong symmetric cipher (**AES-GCM**) with that shared secret.
    * Finally, you sign the message with your **Dilithium private key** to prove it came from you.

3.  **Receiving a Message**:
    * The recipient's app uses their **Kyber private key** to regenerate the exact same shared secret.
    * They use this secret to decrypt the message with **AES-GCM**.
    * Lastly, they use your **Dilithium public key** to verify your signature, ensuring the message is authentic and wasn't tampered with.

This entire cryptographic process happens seamlessly on the client-side, preserving a zero-knowledge environment where the server remains completely unaware of the message content.

***

### Get it Running 🚀

Want to run it locally? Just follow these steps.

**Prerequisites:**
* Node.js & npm
* Python 3.9+ & pip
* A MongoDB Atlas account
* Git

**Installation:**

1.  **Clone the repo:**
    ```sh
    git clone [https://github.com/your-username/post-quantum-secure-chat-app.git](https://github.com/your-username/post-quantum-secure-chat-app.git)
    cd post-quantum-secure-chat-app
    ```

2.  **Set up the backend:**
    ```sh
    cd backend
    pip install -r requirements.txt
    # Create a .env file for your MongoDB URI, JWT secret, etc.
    uvicorn main:app --reload
    ```

3.  **Set up the frontend:**
    ```sh
    cd ../frontend
    npm install
    npm start
    ```
Now, just open your browser to `http://localhost:3000` to start chatting securely!
