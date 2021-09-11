import { FC, useEffect } from "react"

import { ParagraphText } from "@app/components/atoms"
import { Layout, Hero } from "@app/components/containers"
import { signOut } from "@app/aws/authenticate"
import styled from "@emotion/styled"

const StyledDiv = styled.div`
  padding: 1rem;
`

const IndexPage: FC = () => {
  useEffect(() => {
    signOut()
  }, [])

  return (
    <Layout>
    Test
    </Layout>
  )
}

export default IndexPage
