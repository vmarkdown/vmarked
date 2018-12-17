import Renderer from "./renderer";
import defaults from "./options";
import { merge } from './helper';

export default merge({}, defaults, {
    renderer: new Renderer()
});