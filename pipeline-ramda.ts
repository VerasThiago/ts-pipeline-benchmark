import * as ramda from "ramda"
import { githubRequest } from "./githubClient"
import { ORG_NAME } from "./const"

const createPipelineRamda = async (tasks: Array<any>): Promise<any> => {
  var pipeline = ramda.pipe(tasks[0])
  for (var i = 1; i < tasks.length; i++) {
    pipeline = ramda.pipe(pipeline, tasks[i])
  }
  return pipeline
};

const mainRamda = async () => {
  const tasks = [
    async (orgName: any): Promise<any> => orgName,
    async (orgNamePromise: Promise<any>): Promise<any> => {
      const orgName = await orgNamePromise
      return githubRequest(`https://api.github.com/orgs/${orgName}/repos`)
    },
    async (responsePromise: Promise<any>): Promise<any[]> => {
      const response = (await responsePromise)[6]
      return [response.owner.login, response.name]
    },
    async (data: Promise<any>): Promise<any> => {
      const [owner, repo] = await data
      return githubRequest(`https://api.github.com/repos/${owner}/${repo}`)
    },
    async (repo: Promise<any>): Promise<any> => {
      return (await repo).full_name
    },
    async (repoName: Promise<any>): Promise<any> => {
      return await repoName
    }
  ];

  const start = async (input: string) => input

  const pipeline = await createPipelineRamda(tasks)
  console.log(await pipeline(start(ORG_NAME)))
}


mainRamda()
