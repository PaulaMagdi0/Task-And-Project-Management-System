import { useState } from 'react';
import './RecommendationForm.css';  // Import the isolated CSS file

const RecommendationForm = () => {
  const [methodChoice, setMethodChoice] = useState("1");
  const [courseName, setCourseName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [briefDescription, setBriefDescription] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const fetchRecommendations = async () => {
    let url = `http://127.0.0.1:8000/ai/recommendations/?method_choice=${methodChoice}`;
  
    if (methodChoice === "1") {
      url += `&course_name=${courseName}&difficulty=${difficulty}`;
    } else if (methodChoice === "2") {
      url += `&brief_description=${briefDescription}`;
    }
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (response.ok) {
        setRecommendations(data.recommendations);
      } else {
        alert(data.error || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      alert("An error occurred while fetching recommendations.");
    }
  };

  return (
    <div className="recommendation-form-container">
      <div className="recommendation-form-header">
        <h2>AI-Based Task Recommendation</h2>
      </div>
      <div className="recommendation-method-selector">
        <label>
          Recommendation Method:
          <select value={methodChoice} onChange={(e) => setMethodChoice(e.target.value)}>
            <option value="1">Course + Difficulty</option>
            <option value="2">Brief Description</option>
          </select>
        </label>
      </div>
      {methodChoice === "1" ? (
        <div className="recommendation-input-group">
          <input
            type="text"
            placeholder="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="recommendation-input-field"
          />
          <input
            type="text"
            placeholder="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="recommendation-input-field"
          />
        </div>
      ) : (
        <div className="recommendation-input-group">
          <input
            type="text"
            placeholder="Brief Description"
            value={briefDescription}
            onChange={(e) => setBriefDescription(e.target.value)}
            className="recommendation-input-field"
          />
        </div>
      )}
      <button onClick={fetchRecommendations} className="recommendation-submit-btn">Get Recommendations</button>

      <div className="recommendation-cards-container">
        {recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <h3 className="recommendation-title">{rec.title}</h3>
              <p className="recommendation-description">{rec.description}</p>
              <p className="recommendation-course">{rec.course_name}</p>
              <p className="recommendation-difficulty">{rec.difficulty}</p>
            </div>
          ))
        ) : (
          <p className="no-recommendations">No recommendations available.</p>
        )}
      </div>
    </div>
  );
};

export default RecommendationForm;
