import React, { useState } from "react";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";

const MockTest = () => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet);
      const formattedQuestions = jsonData.map((row, index) => ({
        id: index + 1,
        question: row.Question,
        options: [row.OptionA, row.OptionB, row.OptionC, row.OptionD],
        correctAnswer: row.CorrectAnswer,
      }));

      setQuestions(formattedQuestions);
      setScore(null);
      setUserAnswers({});
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle answer selection
  const handleAnswerChange = (questionId, selectedOption) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  };

  // Calculate score
  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
  };

  return (
    <div className="container mt-4" style={{padding: "10%",marginleft: "50%"}}>
      <input type="file" accept=".xlsx, .xls, .pdf" onChange={handleFileUpload} className="form-control mb-3" />

      {questions.length > 0 && (
        <>
          <h2 className="text-center mb-4">Mock Test</h2>
          {questions.map((q) => (
            <div key={q.id} className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">{q.id}. {q.question}</h5>
                {q.options.map((option, idx) => (
                  <div key={idx} className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name={`question-${q.id}`}
                      value={option}
                      checked={userAnswers[q.id] === option}
                      onChange={() => handleAnswerChange(q.id, option)}
                    />
                    <label className="form-check-label">{option}</label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={handleSubmit} className="btn btn-primary mt-3">Submit</button>

          {score !== null && (
            <div className="alert alert-success mt-3">
              Your Score: {score} / {questions.length}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MockTest;
