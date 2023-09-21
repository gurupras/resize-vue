import type { Meta, StoryObj } from '@storybook/vue3'

import Panel from '../components/Panel.vue'
import 'bulma/bulma.sass'
import './panel-styles.scss'

// More on how to set up stories at: https://storybook.js.org/docs/vue/writing-stories/introduction
const meta: Meta<typeof Panel> = {
  title: 'Example/Panel',
  component: Panel,
  // This component will have an automatically generated docsPage entry: https://storybook.js.org/docs/vue/writing-docs/autodocs
  tags: ['autodocs'],
  argTypes: {
  }
}

export default meta
type Story = StoryObj<typeof Panel>;
/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/vue/api/csf
 * to learn how to use render functions.
 */
export const Basic: Story = {
  args: {
    children: [{
      title: 'Child 1'
    }, {
      title: 'Child 2'
    }, {
      title: 'Child 3'
    }]
  }
}
