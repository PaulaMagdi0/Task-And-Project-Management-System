import { useState } from "react";
import "./RecommendationForm.css";
import { apiClient } from "../../services/api"; // Changed to apiClient for consistency

const RecommendationForm = () => {
  const [methodChoice, setMethodChoice] = useState("1");
  const [courseName, setCourseName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [briefDescription, setBriefDescription] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let params = { method_choice: methodChoice };

      if (methodChoice === "1") {
        params.course_name = courseName;
        params.difficulty = difficulty;
      } else if (methodChoice === "2") {
        params.brief_description = briefDescription;
      }

      const { data } = await apiClient.get("/ai/recommendations/", { params });
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(
        err.response?.data?.error ||
          "An error occurred while fetching recommendations."
      );
    } finally {
      setIsLoading(false);
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
          <select
            value={methodChoice}
            onChange={(e) => setMethodChoice(e.target.value)}
            className="recommendation-select"
          >
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
            placeholder="Difficulty (e.g., Beginner, Intermediate)"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="recommendation-input-field"
          />
        </div>
      ) : (
        <div className="recommendation-input-group">
          <textarea
            placeholder="Brief description of what you need..."
            value={briefDescription}
            onChange={(e) => setBriefDescription(e.target.value)}
            className="recommendation-textarea"
            rows={3}
          />
        </div>
      )}

      <button
        onClick={fetchRecommendations}
        className="recommendation-submit-btn"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Get Recommendations"}
      </button>

      {error && <div className="recommendation-error">{error}</div>}

      <div className="recommendation-cards-container">
        {recommendations.length > 0
          ? recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <h3 className="recommendation-title">{rec.title}</h3>
                <p className="recommendation-description">{rec.description}</p>
                {rec.course_name && (
                  <p className="recommendation-meta">
                    <strong>Course:</strong> {rec.course_name}
                  </p>
                )}
                {rec.difficulty && (
                  <p className="recommendation-meta">
                    <strong>Difficulty:</strong> {rec.difficulty}
                  </p>
                )}
              </div>
            ))
          : !isLoading && (
              <p className="no-recommendations">
                No recommendations available. Try different parameters.
              </p>
            )}
      </div>
    </div>
  );
};

export default RecommendationForm;
