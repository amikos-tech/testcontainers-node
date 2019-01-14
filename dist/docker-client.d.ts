import Dockerode, { Container } from "dockerode";
import { PortBindings } from "./port-bindings";
import { RepoTag } from "./repo-tag";
export interface DockerClient {
    pull(repoTag: RepoTag): Promise<void>;
    create(repoTag: RepoTag, portBindings: PortBindings): Promise<Container>;
    start(container: Container): Promise<void>;
}
export declare class DockerodeClient implements DockerClient {
    private readonly dockerode;
    constructor(dockerode?: Dockerode);
    pull(repoTag: RepoTag): Promise<void>;
    create(repoTag: RepoTag, portBindings: PortBindings): Promise<Container>;
    start(container: Container): Promise<void>;
}