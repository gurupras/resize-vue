import type { Meta, StoryObj } from '@storybook/vue3'

import Panel from '../components/pixel-resize/Panel.vue'
import 'bulma/bulma.sass'
import './panel-styles.scss'
import { nextTick } from 'vue'

// More on how to set up stories at: https://storybook.js.org/docs/vue/writing-stories/introduction
const meta: Meta<typeof Panel> = {
  title: 'Example/PixelPanel',
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
    }, {
      title: 'Child 4'
    }]
  },
  render: (args, { argTypes }) => ({
    components: { Panel },
    setup () {
      return {
        args,
        panel: undefined
      }
    },
    template: `
      <div style="height: 90vh; width: 100%; display: flex; flex-direction: row; flex: 1">
        <div style="display: flex; flex: 1; max-width: 420px" style="overflow: hidden; resize: vertical">
          <Panel class="pixel-panel" v-bind="args" ref="panel"/>
        </div>
        <div style="display: flex; flex-direction: column; flex: 1; justify-content: center; margin-left: 12em">
          <div style="margin: 2em 0">
            <button class="button is-link" @click="addChild">Add Child</button>
          </div>
          <div style="margin: 2em 0">
            <button class="button is-link" @click="removeChild()">Remove Child</button>
          </div>
          <div style="margin: 2em 0">
            <button class="button is-link" @click="removeChild(Math.min(args.children.length - 1, 1))">Remove Child 2nd</button>
          </div>
        </div>
      </div>
    `,
    methods: {
      addChild () {
        args.children.push({
          title: `Child ${args.children.length + 1}`
        })
      },
      removeChild (idx = args.children.length - 1) {
        args.children.splice(idx, 1)
      }
    },
    async mounted () {
    }
  })
}
