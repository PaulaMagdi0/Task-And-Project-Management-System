import React, { useState } from "react";
import { apiClient } from "../../services/api";

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
    if (!username) {
      setError("Please enter a GitHub username");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get("/github/stats/", {
        params: {
          username,
          token: token || undefined,
        },
      });
      setRepos(data);
      setDataFetched(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch GitHub data");
      setDataFetched(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepoDetails = async (repoName) => {
    setLoading(true);
    setError("");
    try {
      const [commitsResponse, branchesResponse] = await Promise.all([
        apiClient.get("/github/commits/", {
          params: { username, repo: repoName, token: token || undefined },
        }),
        apiClient.get("/github/branches/", {
          params: { username, repo: repoName, token: token || undefined },
        }),
      ]);
      setCommits(commitsResponse.data);
      setBranches(branchesResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to fetch repository details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRepoClick = (repo) => {
    setSelectedRepo(repo);
    fetchRepoDetails(repo.name);
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
          required
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
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
              <li
                key={`${repo.name}-${repo.id}`}
                className="border p-3 rounded shadow-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-lg">{repo.name}</strong>
                    <p className="text-sm text-gray-600">
                      {repo.language || "No language detected"}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {repo.private ? "🔒 Private" : "🌍 Public"}
                  </span>
                </div>
                <div className="flex space-x-4 mt-2 text-sm">
                  <span>⭐ {repo.stars}</span>
                  <span>🍴 {repo.forks}</span>
                  <span>👀 {repo.watchers}</span>
                  <span>❗ {repo.open_issues}</span>
                </div>
                <button
                  onClick={() => handleRepoClick(repo)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mt-2 text-sm disabled:opacity-50"
                >
                  View Details
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedRepo && (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              🔄 Recent Commits in{" "}
              <span className="text-blue-700">{selectedRepo.name}</span>
            </h2>
            <ul className="space-y-2">
              {commits.length > 0 ? (
                commits.slice(0, 5).map((commit, index) => (
                  <li key={index} className="border p-3 rounded shadow-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {new Date(commit.committer_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium">
                        {commit.committer_name}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{commit.commit_message}</p>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No commits found</p>
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">🌿 Branches</h2>
            <div className="flex flex-wrap gap-2">
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <span
                    key={branch.name}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {branch.name}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No branches found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubStat;
