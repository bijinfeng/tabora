import { definePackageUnitTestProject } from "../vitest/config"

export default definePackageUnitTestProject({
  root: new URL(".", import.meta.url).pathname,
  test: {
    name: "stylex-config",
  },
})
