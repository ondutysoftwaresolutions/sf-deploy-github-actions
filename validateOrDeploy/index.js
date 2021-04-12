/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 727:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateDeployment = void 0;
const core_1 = __nccwpck_require__(186);
const execSync_1 = __importDefault(__nccwpck_require__(205));
const constants_1 = __nccwpck_require__(122);
const Deployment_1 = __importDefault(__nccwpck_require__(552));
const processValidationResult_1 = __nccwpck_require__(94);
const run = async () => {
    const configuration = new Deployment_1.default(core_1.getInput('package_path'), core_1.getInput('test_level'), core_1.getInput('wait_time'), core_1.getInput('deploy'), core_1.getInput('org_type'), core_1.getInput('is_destructive'));
    core_1.info(`*** ${configuration.deploy ? 'Deployment' : 'Validation'} of the Package started ***`);
    const params = [];
    // add the right command for package.xml or destructive changes
    if (configuration.isDestructive) {
        params.push('force:mdapi:deploy', '--ignorewarnings', '--deploydir');
    }
    else {
        params.push('force:source:deploy', '--manifest');
    }
    // add the package
    params.push(configuration.packageToDeploy, '--targetusername', constants_1.DEFAULT_ALIAS_SF_INSTANCE, '--wait', configuration.waitTime, '--json');
    // check if it's not a deploy, then it's a validation, and the Job Id will be output to use in a quick deploy
    if (!configuration.deploy) {
        params.push('--checkonly');
    }
    // check the test level
    if (configuration.testLevel) {
        params.push('--testlevel');
        if (configuration.testLevel === constants_1.TestLevel.LOCAL_TEST) {
            core_1.info('*** Running All Tests ***');
            params.push(constants_1.TestLevel.LOCAL_TEST);
        }
        else {
            core_1.info('*** Not Running Tests ***');
            params.push(constants_1.TestLevel.NO_TEST);
        }
    }
    // execute the validation in the SF instance of the package
    const result = execSync_1.default(constants_1.Commands.SFDX, params);
    // parsed the result
    const parsedResult = JSON.parse(result);
    // if it was a deployment, check the tests results if need it.
    // if it was a validation, process the results and return the job id
    if (configuration.deploy) {
        if (configuration.testLevel && configuration.testLevel !== constants_1.TestLevel.NO_TEST) {
            if (!parsedResult.result.success) {
                processValidationResult_1.logTestErrors(parsedResult.result);
                core_1.setFailed('The Deployment of the package failed.');
            }
        }
        core_1.info(`\u001b[35m*** Successful Deployment of the Package. ***`);
        core_1.setOutput('job_id', '0');
    }
    else {
        // process the result to set the output or the errors
        processValidationResult_1.processValidationResult(parsedResult.result);
    }
};
exports.validateDeployment = run;
run();


/***/ }),

/***/ 552:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const constants_1 = __nccwpck_require__(122);
class Deployment {
    constructor(packageToDeploy, testLevel, waitTime, deploy, orgType, isDestructive) {
        this.packageToDeploy = packageToDeploy;
        this.waitTime = waitTime || '30';
        this.testLevel = testLevel ? testLevel : undefined;
        this.orgType = orgType || constants_1.OrgType.SANDBOX;
        this.deploy = deploy === 'true' && orgType !== constants_1.OrgType.PRODUCTION ? true : false;
        this.isDestructive = isDestructive === 'true' ? true : false;
    }
}
exports.default = Deployment;


/***/ }),

/***/ 122:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_MINIMUM_TEST_COVERAGE = exports.DEFAULT_SFDX_CLI_INSTALLATION_FOLDER = exports.DEFAULT_BASE_ALIAS_SCRATCH_ORG = exports.DEFAULT_ALIAS_SF_INSTANCE = exports.SF_URLs = exports.OrgType = exports.Commands = exports.TestLevel = void 0;
var TestLevel;
(function (TestLevel) {
    TestLevel["LOCAL_TEST"] = "RunLocalTests";
    TestLevel["NO_TEST"] = "NoTestRun";
})(TestLevel = exports.TestLevel || (exports.TestLevel = {}));
var Commands;
(function (Commands) {
    Commands["SFDX"] = "sfdx";
    Commands["OPEN_SSL"] = "openssl";
    Commands["WGET"] = "wget";
    Commands["MKDIR"] = "mkdir";
    Commands["TAR"] = "tar";
    Commands["EXPORT"] = "export";
})(Commands = exports.Commands || (exports.Commands = {}));
var OrgType;
(function (OrgType) {
    OrgType["SCRATCH"] = "scratch";
    OrgType["SANDBOX"] = "sandbox";
    OrgType["PRODUCTION"] = "production";
})(OrgType = exports.OrgType || (exports.OrgType = {}));
var SF_URLs;
(function (SF_URLs) {
    SF_URLs["SANDBOX"] = "https://test.salesforce.com";
    SF_URLs["PRODUCTION"] = "https://login.salesforce.com";
})(SF_URLs = exports.SF_URLs || (exports.SF_URLs = {}));
exports.DEFAULT_ALIAS_SF_INSTANCE = 'DevHub_Instance';
exports.DEFAULT_BASE_ALIAS_SCRATCH_ORG = 'scratch-org-cicd';
exports.DEFAULT_SFDX_CLI_INSTALLATION_FOLDER = 'sfdx-cli';
exports.DEFAULT_MINIMUM_TEST_COVERAGE = 75;


/***/ }),

/***/ 205:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __nccwpck_require__(186);
const child_process_1 = __nccwpck_require__(129);
const execSync = (command, params = []) => {
    const result = child_process_1.spawnSync(command, params, { encoding: 'utf-8' });
    if (result.status !== 0 && result.stderr !== '') {
        const errorMessage = `ERROR MESSAGE: ${result.error ? result.error.toString() : ''} ${result.stderr ? result.stderr.toString() : ''}. / FULL RESPONSE: ${JSON.stringify(result)}`;
        core_1.error(`ERROR when executing the command ${command} with params ${params.toString()}`);
        core_1.error(errorMessage);
        core_1.setFailed(errorMessage);
    }
    core_1.info(`SUCCESSFUL execution of the command ${command} with params ${params.toString()}`);
    return result.stdout;
};
exports.default = execSync;


/***/ }),

/***/ 94:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getFailedTestResult = exports.processValidationResult = exports.logTestErrors = void 0;
const core_1 = __nccwpck_require__(186);
const getFailedTestResult = (failures) => {
    const result = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    failures.forEach((fail) => {
        result.push(`\u001b[35mTest Class: ${fail.name}`);
        result.push(`\u001b[38;2;163;132;75mMethod: ${fail.methodName}`);
        result.push(`ERROR: ${fail.message} \n`);
    });
    return result;
};
exports.getFailedTestResult = getFailedTestResult;
// eslint-disable-next-line
const logTestErrors = (result) => {
    // if it's test failures
    if (result.numberTestErrors > 0) {
        core_1.info(`*** FAILED TESTS (${result.numberTestErrors} tests) ***\n`);
        // get the failure class names
        const failed = getFailedTestResult(result.details.runTestResult.failures);
        failed.forEach((fail) => {
            core_1.info(fail);
        });
    }
};
exports.logTestErrors = logTestErrors;
// eslint-disable-next-line
const processValidationResult = (result) => {
    // if it was a success set the job id as the output
    if (result.success) {
        core_1.info(`\u001b[35m*** Successful validation of the Package. JOB ID: ${result.id} ***`);
        core_1.setOutput('job_id', result.id);
    }
    else {
        core_1.info('\u001b[38;2;255;0;0m*** Unsuccessful validation of the Package ***\n');
        // if it's test failures
        logTestErrors(result);
        core_1.setFailed('The validation of the package failed.');
    }
};
exports.processValidationResult = processValidationResult;


/***/ }),

/***/ 351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const command_1 = __nccwpck_require__(351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(278);
const os = __importStar(__nccwpck_require__(87));
const path = __importStar(__nccwpck_require__(622));
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 */
function error(message) {
    command_1.issue('error', message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 */
function warning(message) {
    command_1.issue('warning', message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


// For internal use, subject to change.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(747));
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 278:
/***/ ((__unused_webpack_module, exports) => {


// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 129:
/***/ ((module) => {

module.exports = require("child_process");;

/***/ }),

/***/ 747:
/***/ ((module) => {

module.exports = require("fs");;

/***/ }),

/***/ 87:
/***/ ((module) => {

module.exports = require("os");;

/***/ }),

/***/ 622:
/***/ ((module) => {

module.exports = require("path");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(727);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;