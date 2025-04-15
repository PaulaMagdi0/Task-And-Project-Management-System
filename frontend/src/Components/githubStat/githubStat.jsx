import React, { useState } from "react";
import axios from "axios";

const GitHubStat = () => {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataFetched, setDataFetched] = useState(false);

  const fetchRepos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/github/stats/", {
        params: {
          username: username,
          token: token || undefined,
        },
      });
      setRepos(response.data);
      setDataFetched(true);
    } catch (err) {
      setError("Failed to fetch GitHub data.");
      setDataFetched(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommits = async (repoName) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/github/commits/`, {
        params: {
          username,
          repo: repoName,
          token: token || undefined,
        },
      });
      setCommits(response.data);
    } catch (err) {
      setError("Failed to fetch commits.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (repoName) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/github/branches/`, {
        params: {
          username,
          repo: repoName,
          token: token || undefined,
        },
      });
      setBranches(response.data);
    } catch (err) {
      setError("Failed to fetch branches.");
    } finally {
      setLoading(false);
    }
  };

  const handleRepoClick = async (repo) => {
    setSelectedRepo(repo);
    await fetchCommits(repo.name);
    await fetchBranches(repo.name);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📊 GitHub Stats Viewer</h1>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="GitHub Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="(Optional) GitHub Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          onClick={fetchRepos}
          disabled={loading || !username}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Loading..." : "Fetch Stats"}
        </button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {repos.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">📁 Repositories</h2>
          <ul className="space-y-2">
            {repos.map((repo) => (
              <li key={`${repo.name}-${repo.id}`} className="border p-3 rounded shadow-sm">
                <strong>{repo.name}</strong>
                <p>Language: {repo.language || "N/A"}</p>
                <p>
                  ⭐ {repo.stars} | 🍴 {repo.forks} | 👀 {repo.watchers} | ❗ {repo.open_issues}
                </p>
                <p>Visibility: {repo.private ? "🔒 Private" : "🌍 Public"}</p>
                <button
                  onClick={() => handleRepoClick(repo)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mt-2"
                >
                  View Commits & Branches
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedRepo && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">
            🔄 Commits for <span className="text-blue-700">{selectedRepo.name}</span>
          </h2>
          <ul className="space-y-2">
            {commits.length > 0 ? (
              commits.map((commit, index) => (
                <li key={index} className="border p-2 rounded shadow-sm">
                  <strong>{commit.committer_name}</strong> - {commit.committer_date}
                  <p>{commit.commit_message}</p>
                </li>
              ))
            ) : (
              <p>No commits found.</p>
            )}
          </ul>

          <h2 className="text-xl font-semibold mt-4 mb-2">🌿 Branches</h2>
          <ul className="space-y-2">
            {branches.length > 0 ? (
              branches.map((branch, index) => (
                <li key={index} className="border p-2 rounded shadow-sm">
                  {branch.name}
                </li>
              ))
            ) : (
              <p>No branches found.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GitHubStat;
