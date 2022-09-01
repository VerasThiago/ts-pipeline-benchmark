import { githubRequest } from "./githubClient"
import { ORG_NAME } from "./const"

const pipeRec = <A, B>(fn: (a: A) => B) => {
  return {
    pipe: function <C>(g: (x: B) => C) { return pipeRec((arg: A) => g(fn(arg))) },
    run: async () => fn
  }
}

const createPipelineRec = async (tasks: Array<any>): Promise<any> => {
  let pipeline = pipeRec(tasks[0]());
  for (let i = 1; i < tasks.length; i++) {
    pipeline = pipeline.pipe(tasks[i]());
  }
  return pipeline.run();
};

const mainRec = async () => {
  const tasks = [
    () => (orgName: string): string => orgName,
    () => async (orgNamePromise: Promise<string>): Promise<any> => {
      const orgName = await orgNamePromise
      return githubRequest(`https://api.github.com/orgs/${orgName}/repos`)
    },
    () => async (responsePromise: Promise<any>): Promise<string[]> => {
      const response = (await responsePromise)[6]
      return [response.owner.login, response.name]
    },
    () => async (data: Promise<string[]>): Promise<any> => {
      const [owner, repo] = await data
      return githubRequest(`https://api.github.com/repos/${owner}/${repo}`)
    },
    () => async (repo: Promise<any>): Promise<string> => {
      return (await repo).full_name
    },
    () => async (repoName: Promise<string>): Promise<string> => {
      return await repoName
    }
  ];

  const result = await createPipelineRec(tasks);
  console.log(await result(ORG_NAME));
}


mainRec()
