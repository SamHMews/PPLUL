import test from 'node:test';
import assert from 'node:assert/strict';
import {swipeDirection} from '../dist/gestures.js';
test('intentional drags and short flicks browse in both directions',()=>{
  assert.equal(swipeDirection(-90,0),1);
  assert.equal(swipeDirection(90,0),-1);
  assert.equal(swipeDirection(-20,-500),1);
  assert.equal(swipeDirection(20,500),-1);
});
test('taps and small movements do not navigate; reversal follows release momentum',()=>{
  assert.equal(swipeDirection(3,1500),0);
  assert.equal(swipeDirection(20,0),0);
  assert.equal(swipeDirection(-60,1200),-1);
});
