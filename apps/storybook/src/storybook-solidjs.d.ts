declare module "storybook-solidjs" {
  type ComponentProps<TComponent> = TComponent extends (props: infer TProps) => unknown
    ? TProps
    : Record<string, unknown>

  export type Meta<TComponent = unknown> = {
    title?: string
    component?: TComponent
    args?: Partial<ComponentProps<TComponent>>
    argTypes?: Record<string, unknown>
    parameters?: Record<string, unknown>
    tags?: string[]
    render?: (args: Partial<ComponentProps<TComponent>>) => unknown
  } & Record<string, unknown>

  export type StoryObj<TMeta = Meta> = {
    args?: any
    parameters?: Record<string, unknown>
    render?: (args: any) => unknown
  } & Record<string, unknown>
}
