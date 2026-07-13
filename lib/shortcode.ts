import { customAlphabet } from "nanoid";

// Unambiguous alphabet (no 0/O/1/I/l) so codes are easy to read/type
// off a printed PDF if the camera fails to scan.
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
export const generateShortCode = customAlphabet(alphabet, 8);
