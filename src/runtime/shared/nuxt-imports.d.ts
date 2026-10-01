declare module '#imports' {
  export function useRuntimeConfig(): {
    public: {
      nuxtJpLocalRuntime: {
        endpoint: string
      }
    }
  }
}
