import { createFsFromVolume } from "memfs"
import { vol } from "../../src/test-support"

module.exports = createFsFromVolume(vol).promises
