import React, { ComponentProps } from 'react'
import { useLocation, useParams } from 'react-router-dom'

// eslint-disable-next-line @typescript-eslint/naming-convention
const WithRouter = (Component: React.FunctionComponent<ComponentProps<any>>) => {
  function ComponentWithRouterProp(props: ComponentProps<any>) {
    const location = useLocation()
    const params = useParams()
    return <Component {...props} router={{ location, params }} />
  }

  return ComponentWithRouterProp
}

export type RouterProps<T extends Record<string, string>> = {
  location: ReturnType<typeof useLocation>
  params: ReturnType<typeof useParams<T>>
}

export default WithRouter
