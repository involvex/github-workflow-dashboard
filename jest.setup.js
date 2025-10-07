import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Add TextEncoder/TextDecoder to global scope for Web Crypto API support
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
