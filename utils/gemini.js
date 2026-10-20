import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  // Standard GoogleGenerativeAI initialization
  return new GoogleGenerativeAI(apiKey);
};


// Helper to strip markdown formatting and parse JSON
const parseJSONResponse = (text) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch (error) {
    console.error(`[Gemini Parse Error] Failed to parse: ${text}. Error: ${error.message}`);
    throw new Error('Failed to parse AI response into JSON');
  }
};

// 1. Smart Symptom Checker
export const diagnoseSymptoms = async (symptoms, age, gender, medicalHistory) => {
  const client = getGeminiClient();
  
  if (!client) {
    console.log('[Gemini] API Key missing. Returning high-fidelity mock diagnosis.');
    return getMockDiagnosis(symptoms, age, gender, medicalHistory);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert AI clinical diagnostics engine.
      Analyze the following patient profile and symptoms:
      - Symptoms: "${symptoms}"
      - Age: ${age}
      - Gender: "${gender}"
      - Medical History: "${medicalHistory || 'None reported'}"

      Provide a strict JSON response (no markdown backticks, no extra commentary, just valid parseable JSON) matching this exact format:
      {
        "possibleDiseases": [
          {
            "name": "Disease Name",
            "probability": 85, // out of 100
            "description": "Brief medical explanation of why this disease fits the symptoms."
          }
        ],
        "riskLevel": "high", // must be exactly "low", "medium", or "high"
        "suggestedTests": [
          "CBC (Complete Blood Count)",
          "Chest X-Ray"
        ],
        "clinicalReasoning": "General clinical summary explaining how age, gender, medical history, and symptoms combine to guide this diagnostic outline."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJSONResponse(text);
  } catch (error) {
    console.error(`[Gemini Diagnose Error]: ${error.message}. Falling back to mock.`);
    return getMockDiagnosis(symptoms, age, gender, medicalHistory);
  }
};

// 2. Prescription Explainer (with Urdu option support handled dynamically by prompt)
export const explainPrescription = async (medicines, notes) => {
  const client = getGeminiClient();
  
  if (!client) {
    console.log('[Gemini] API Key missing. Returning high-fidelity mock explanation.');
    return getMockExplanation(medicines, notes);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const medicinesStr = medicines.map(m => `${m.name} (${m.dosage}, ${m.duration}) - Instructions: ${m.instructions || 'None'}`).join('\n');
    
    const prompt = `
      You are an expert AI pharmacist and clinical therapist.
      Explain the following prescription to a patient:
      Medicines:
      ${medicinesStr}
      Doctor's Notes: "${notes || 'No notes'}"

      Generate a simple, highly professional structured JSON response (no markdown backticks, no comments, just valid JSON) matching this format:
      {
        "simpleExplanation": "Layman description of what these medications are for, how they work together, and general advice on taking them.",
        "lifestyleRecommendations": [
          "Drink at least 3 liters of lukewarm water daily.",
          "Avoid direct exposure to dusty environments."
        ],
        "preventiveAdvice": [
          "Take vitamins regularly.",
          "Complete the antibiotic course even if you feel better."
        ],
        "urduExplanation": {
          "explanation": "اردو زبان میں دواؤں کی سادہ اور آسان وضاحت تاکہ مریض سمجھ سکے۔",
          "lifestyle": [
            "روزانہ وافر مقدار میں پانی پیئیں۔",
            "گرد و غبار والے ماحول سے پرہیز کریں۔"
          ],
          "instructions": "دوا کا پورا کورس مکمل کریں۔"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJSONResponse(text);
  } catch (error) {
    console.error(`[Gemini Explainer Error]: ${error.message}. Falling back to mock.`);
    return getMockExplanation(medicines, notes);
  }
};

// 3. Chronic Risk & High-Risk Combination Detector
export const detectPatientRisk = async (symptoms, age, gender, medicalHistory) => {
  const client = getGeminiClient();

  if (!client) {
    console.log('[Gemini] API Key missing. Returning mock Risk Detection.');
    return getMockRisk(symptoms, age, gender, medicalHistory);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert AI Clinical Risk Coordinator.
      Evaluate if the patient's profiles exhibit high-risk combinations, chronic tendencies, or repeated patterns:
      - Symptoms: "${symptoms}"
      - Age: ${age}
      - Gender: "${gender}"
      - Medical History: "${medicalHistory || 'None reported'}"

      Return a strict JSON block (no markdown backticks, no comments, just valid JSON) matching this format:
      {
        "riskScore": 8, // scale of 1 to 10
        "detectedRisks": [
          "High blood pressure combined with acute migraine suggests cardiovascular stress."
        ],
        "isHighRiskCombination": true, // true if multiple severe warning factors trigger together
        "urgentAlert": "Schedule an immediate ECG scan and monitor sodium intake immediately.", // empty string if low risk
        "preventativeActions": [
          "Reduce daily sodium intake.",
          "Monitor blood pressure twice daily."
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJSONResponse(text);
  } catch (error) {
    console.error(`[Gemini Risk Error]: ${error.message}. Falling back to mock.`);
    return getMockRisk(symptoms, age, gender, medicalHistory);
  }
};

// --- MOCK FALLBACK GENERATORS ---

function getMockDiagnosis(symptoms, age, gender, medicalHistory) {
  const sym = symptoms.toLowerCase();
  let diseases = [];
  let risk = 'low';
  let tests = ['Complete Blood Count (CBC)'];
  let reasoning = `Symptoms of '${symptoms}' in a ${age} year old ${gender} analyzed against clinical benchmarks.`;

  if (sym.includes('fever') || sym.includes('cough') || sym.includes('flu')) {
    diseases = [
      { name: 'Acute Viral Influenza', probability: 80, description: 'A common viral infection targeting the respiratory system.' },
      { name: 'Streptococcal Pharyngitis', probability: 40, description: 'Bacterial infection causing sore throat and fever.' }
    ];
    tests.push('Throat Swab Culture', 'Rapid Flu Test');
    risk = age > 60 || age < 5 ? 'medium' : 'low';
  } else if (sym.includes('chest pain') || sym.includes('heart') || sym.includes('breath')) {
    diseases = [
      { name: 'Angina Pectoris / Cardiorespiratory Strain', probability: 75, description: 'Reduced oxygen supply to the cardiac muscles.' },
      { name: 'Gastroesophageal Reflux Disease (GERD)', probability: 50, description: 'Stomach acid flowing back into the esophagus mimicking chest discomfort.' }
    ];
    tests.push('Electrocardiogram (ECG)', 'Troponin Level Blood Test', 'Echocardiogram');
    risk = 'high';
    reasoning += ' Chest discomfort requires immediate cardiac rule-out due to critical high-risk indicators.';
  } else if (sym.includes('stomach') || sym.includes('pain') || sym.includes('vomit')) {
    diseases = [
      { name: 'Acute Gastroenteritis', probability: 85, description: 'Inflammation of the stomach lining caused by foodborne pathogens.' },
      { name: 'Irritable Bowel Syndrome (IBS) Flare-up', probability: 45, description: 'Chronic gastrointestinal spasms exacerbated by stress or diet.' }
    ];
    tests.push('Abdominal Ultrasound', 'Stool Routine Examination');
    risk = 'medium';
  } else {
    diseases = [
      { name: 'General Physical Exhaustion / Mild Dehydration', probability: 70, description: 'Inadequate fluid intake combined with stress.' },
      { name: 'Subclinical Immune Response', probability: 35, description: 'Mild inflammatory reaction to environment.' }
    ];
    tests.push('Basic Metabolic Panel (BMP)');
    risk = 'low';
  }

  return { possibleDiseases: diseases, riskLevel: risk, suggestedTests: tests, clinicalReasoning: reasoning };
}

function getMockExplanation(medicines, notes) {
  return {
    simpleExplanation: `Your prescription contains ${medicines.length} medication(s). These are selected to combat active bacterial/viral inflammation, lower physical discomfort, and promote systemic recovery. Please take them strictly as scheduled.`,
    lifestyleRecommendations: [
      "Ensure a minimum of 8 hours of uninterrupted sleeping rest.",
      "Stay hydrated by consuming at least 8-10 glasses of clean, filtered water daily.",
      "Avoid oily, extremely spicy foods while undergoing treatment."
    ],
    preventiveAdvice: [
      "Wash hands thoroughly before meals and after clinic visits.",
      "Complete the entire prescribed medication course even if symptoms subside early.",
      "If you experience sudden rashes or severe vomiting, contact your doctor immediately."
    ],
    urduExplanation: {
      explanation: `آپ کی نسخہ میں ${medicines.length} دوائیں شامل ہیں۔ یہ آپ کے فعال علامات اور سوزش کو دور کرنے، درد کو کم کرنے، اور صحت یابی کے عمل کو تیز کرنے کے لیے دی گئی ہیں۔ براہ کرم ان کو وقت پر لیں۔`,
      lifestyle: [
        "کم از کم ۸ گھنٹے کی مکمل نیند لیں۔",
        "روزانہ کم از کم ۸ سے ۱۰ گلاس صاف پانی ضرور پیئیں۔",
        "علاج کے دوران تیز مصالحہ دار اور تلی ہوئی غذاؤں سے مکمل پرہیز کریں۔"
      ],
      instructions: "حتیٰ کہ اگر آپ بہتر محسوس کریں تو بھی ڈاکٹر کی بتائی گئی خوراک کا پورا کورس مکمل کریں۔"
    }
  };
}

function getMockRisk(symptoms, age, gender, medicalHistory) {
  const sym = symptoms.toLowerCase();
  const hist = (medicalHistory || '').toLowerCase();
  
  let score = 2;
  let risks = ['No high-risk, recurring chronic trends detected.'];
  let isHigh = false;
  let alert = '';
  let actions = ['Maintain annual physical wellness examinations.'];

  if (sym.includes('chest') || sym.includes('breath') || hist.includes('heart') || hist.includes('diabetes')) {
    score = 8;
    risks = [
      'Chronic cardiovascular strain combined with pulmonary stress indicators.',
      'Complications arising from metabolic histories under physical duress.'
    ];
    isHigh = true;
    alert = 'URGENT: High cardiac risk combination identified. Immediate blood pressure screening and pulse monitoring recommended.';
    actions = [
      'Record blood pressure readings twice daily (morning & night).',
      'Reduce processed sodium and saturated fats to negligible levels.',
      'Engage in low-impact walking exercises under monitoring.'
    ];
  } else if (sym.includes('fever') && hist.includes('asthma')) {
    score = 6;
    risks = ['Bronchospasms triggered by upper respiratory infections.'];
    isHigh = false;
    alert = 'Caution: Asthmatic tendencies may aggravate bronchial airway passages during high fever.';
    actions = [
      'Keep your nebulizer or rescue inhaler at hand.',
      'Check blood oxygen saturation using a pulse oximeter.'
    ];
  }

  return { riskScore: score, detectedRisks: risks, isHighRiskCombination: isHigh, urgentAlert: alert, preventativeActions: actions };
}
