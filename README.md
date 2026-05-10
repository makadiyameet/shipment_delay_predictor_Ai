# 🚚 AI Shipment Delay Predictor

An AI-powered logistics dashboard that predicts shipment delays before they happen using advanced risk analysis and large language models.

## 🌐 Live Demo

https://shipment-delay-predictor-igrbocblo-meet15.vercel.app/

---

# ✨ Features

- 🤖 AI-powered shipment delay prediction
- 📊 Risk level analysis (High / Medium / Low)
- ⏳ Delay probability estimation
- 📅 Estimated delay duration
- ⚠️ Risk factor identification
- ✅ Recommended logistics actions
- 🚛 Alternative carrier suggestions
- 📁 CSV upload support
- 📈 Dashboard analytics
- 📱 Responsive modern UI
- ⚡ Real-time API integration with Groq AI

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Vite

## Backend
- Vercel Serverless Functions
- Groq API
- groq-sdk

## Deployment
- Vercel
- GitHub

---

# 📂 Project Structure

```text
shipment-delay-predictor-ai/
│
├── api/
│   └── chat.js
│
├── src/
│   └── App.jsx
│
├── public/
├── .env
├── package.json
├── vite.config.js
└── README.md
````

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/makadiyameet/shipment_delay_predictor_Ai
```

Move into the project folder:

```bash
cd shipment-delay-predictor-ai
```

Install dependencies:

```bash
npm install
```

Install Groq SDK:

```bash
npm install groq-sdk
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
```

---

# ▶️ Run Locally

Start the development server:

```bash
npm run dev
```

---

# 📡 API Endpoint

## POST `/api/chat`

Processes shipment analysis requests using Groq AI.

Example request:

```json
{
  "message": "Analyze shipment risk..."
}
```

---

# 📊 Features Overview

The AI analyzes shipment data including:

* Shipment route
* Carrier performance
* Transit duration
* Customs clearance status
* Cargo category
* Temperature requirements
* Delivery timelines

The system then predicts:

* Delay probability
* Estimated delay days
* Risk level
* Key risk factors
* Recommended actions

---

# 🚀 Deployment

This project is deployed using Vercel and connected with GitHub for automatic deployments.

---

# 🔮 Future Improvements

* Real logistics API integration
* Live shipment tracking
* Historical shipment analytics
* User authentication
* AI-generated logistics reports
* Predictive trend analysis
* Multi-language support

---

# 👨‍💻 Author

Developed by Meet Makadiya

* GitHub: [https://github.com/makadiyameet](https://github.com/makadiyameet)

---

```
```
