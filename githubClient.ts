import axios from "axios"
import { GITHUB_TOKEN } from "./const"

export const githubRequest = async (path: string): Promise<any> => {
  var data = JSON.stringify({
    "name": "test",
    "description": "This is your first repository",
    "homepage": "https://github.com",
    "private": false,
    "has_issues": true,
    "has_projects": true,
    "has_wiki": true
  });

  var request = {
    method: 'get',
    url: path,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    data: data
  };

  const res = await axios(request)
  return res.data
}