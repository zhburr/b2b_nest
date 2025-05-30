import * as fs from 'fs';
import { promisify } from 'util';

/**
 * Check if a file exists at a given path.
 *
 * @param {string} path
 *
 * @returns {boolean}
 */
export const checkIfFileOrDirectoryExists = (path: string): boolean => {
  return fs.existsSync(path);
};

/**
 * Gets file data from a given path via a promise interface.
 *
 * @param {string} path
 * @param {string} encoding
 *
 * @returns {Promise<Buffer>}
 */
export const getFile = async (path: string): Promise<string | Buffer> => {
  const readFile = promisify(fs.readFile);

  return readFile(path);
};

/**
 * Writes a file at a given path via a promise interface.
 *
 * @param {string} path
 * @param {string} fileName
 * @param {string} data
 *
 * @return {Promise<void>}
 */
export const createFile = async (
  path: string,
  fileName: string,
  data: string,
): Promise<void> => {
  if (!checkIfFileOrDirectoryExists(path)) {
    fs.mkdirSync(path);
  }

  const writeFile = promisify(fs.writeFile);

  return await writeFile(`${path}/${fileName}`, data);
};

/**
 * Delete file at the given path via a promise interface
 *
 * @param {string} path
 *
 * @returns {Promise<void>}
 */
export const deleteFile = async (path: string): Promise<void> => {
  const unlink = promisify(fs.unlink);
  return await unlink(path);
};
