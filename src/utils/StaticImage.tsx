import Image, { ImageProps } from 'next/image'
import { FC } from 'react'

const StaticImage: FC<ImageProps> = (props) => <Image loader={({ src }) => `/statics/${src}`} {...props} />

export default StaticImage


