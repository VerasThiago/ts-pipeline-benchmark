import { ORG_NAME } from "./const";
import { githubRequest } from "./githubClient"

export interface NewProjectContext {
  orgName?: string;
  body?: any;
  owner?: string;
  repo?: string;
  full_name?: string;
}

export class PipeError extends Error {

  public failedStage: string
  public ctx: PipelineContext

  constructor(public message: string, failedStage: string, ctx: PipelineContext, stack?: string) {
    super(message);
    this.failedStage = failedStage
    this.name = "PipelineFail";
    this.ctx = ctx
    this.stack = stack
  }

}
export type PipeStage = string
export type PipelineContext = NewProjectContext
export type PipeFunction = (ctx: PipelineContext) => Promise<void>
export type Pipe = {
  pipe: (task: PipeStep) => Pipe;
  run: () => PipeFunction;
}
export interface PipeStep {
  runner: PipeFunction
  stage: PipeStage
}

const getPipelineInfo = (stage: string, step: number, total_steps: number, status: string): string => {
  return JSON.stringify({
    "stage": stage,
    "current_step": step,
    "total_steps": total_steps,
    "status": status,
  }) + '\n'
}

function pipe(task: PipeStep): Pipe {
  const pipeline: Array<PipeStep> = [task];
  const pipe: Pipe = {
    pipe: (task: PipeStep) => {
      pipeline.push(task);
      return pipe;
    },
    run: () => {
      return async (ctx: PipelineContext): Promise<void> => {
        for (const idx in pipeline) {
          const task = pipeline[idx]
          try {
            await task.runner(ctx)
          } catch (err: unknown) {
            throw new PipeError(
              (err as Error).message,
              task.stage,
              ctx,
              (err as Error).stack,
            );
          }
        }
      }
    },
  };
  return pipe;
}

export const createPipeline = (startTask: number, taskArr: Array<PipeStep>): () => PipeFunction => {
  let pipeline: Pipe = pipe(taskArr[startTask]);
  for (let idx = startTask + 1; idx < taskArr.length; idx++) {
    pipeline = pipeline.pipe(taskArr[idx]);
  }
  return pipeline.run;
};



export const NewProjectPipelineTasks: Array<PipeStep> = [
  {
    runner: async (
      ctx: NewProjectContext,
    ) => {
      ctx.orgName = ORG_NAME;
    },
    stage: "GET_ORG_NAME"
  },
  {
    runner: async (
      ctx: NewProjectContext,
    ) => {
      ctx.body = await githubRequest(`https://api.github.com/orgs/${ctx.orgName}/repos`)
    },
    stage: "GET_REPOS_LIST"
  },
  {
    runner: async (
      ctx: NewProjectContext,
    ) => {
      const response = ctx.body[6]
      ctx.owner = response.owner.login
      ctx.repo = response.name
    },
    stage: "SET_OWNER_REPO_NAME"
  },
  {
    runner: async (
      ctx: NewProjectContext,
    ) => {
      ctx.body = githubRequest(`https://api.github.com/repos/${ctx.owner}/${ctx.repo}`)
    },
    stage: "GET_REPO_INFO"
  },
  {
    runner: async (
      ctx: NewProjectContext,
    ) => {
      ctx.full_name = ctx.body.full_name
    },
    stage: "GET_FULL_NAME"
  },
  {
    runner: async (
      ctx: NewProjectContext,
    ) => {
      console.log("ctx.full_name", ctx.full_name);
    },
    stage: "PRINT_NAME"
  },
]



const mainDeco = async () => {
  const pipeline = createPipeline(0, NewProjectPipelineTasks);

  const ctx: NewProjectContext = {};

  await pipeline()(ctx)
}


mainDeco()