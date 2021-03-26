import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  getWorkspacePath,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';
import * as path from 'path';
import { hasDependency } from '../../utils/adsp-utils';
import { ReactAppGeneratorSchema } from './schema';

interface NormalizedSchema extends ReactAppGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  openshiftDirectory: string;
  tenantRealm: string;
  accessServiceUrl: string;
}

function normalizeOptions(
  host: Tree,
  options: ReactAppGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${projectDirectory}`;
  
  const openshiftDirectory = 
    `${path.dirname(getWorkspacePath(host))}/.openshift/${projectDirectory}`
  
  const tenantRealm = options.tenant;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    openshiftDirectory,
    tenantRealm,
    accessServiceUrl: 'https://access.alpha.alberta.ca'
  };
}

function addFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    host,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

export default async function (host: Tree, options: ReactAppGeneratorSchema) {
  
  const normalizedOptions = normalizeOptions(host, options);
  
  const initReact = wrapAngularDevkitSchematic('@nrwl/react', 'application');
  const initRedux = wrapAngularDevkitSchematic('@nrwl/react', 'redux');
  
  await initReact(host, options);
  await initRedux(host, {...options, name: 'intake', project: options.name});
  
  addDependenciesToPackageJson(
    host, 
    {
      '@abgov/core-css': '^0.7.56',
      '@abgov/react-components': '^0.7.56',
    },
    {
    }
  )
  
  addFiles(host, normalizedOptions);
  await formatFiles(host);

  const config = readProjectConfiguration(host, options.name);
  config.targets.build.options.assets = [
    ...config.targets.build.options.assets,
    {
      "glob": "nginx.conf",
      "input": `${getWorkspaceLayout(host).appsDir}/${options.name}`,
      "output": "./"
    }
  ]
  updateProjectConfiguration(host, options.name, config);

  if (hasDependency(host, '@abgov/nx-oc')) {
    const { deploymentGenerator } = await import(`${'@abgov/nx-oc'}`);
    await deploymentGenerator(
      host, 
      {
        ...options, 
        project: normalizedOptions.projectName, 
        frontend: true
      }
    );
  }
}
