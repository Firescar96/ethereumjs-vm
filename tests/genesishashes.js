import ethTests from 'ethereumjs-testing'
import tape from 'tape'
import VM from '../lib'
const vm = new VM()
const genesisData = ethTests.getSingleFile('BasicTests/genesishashestest.json')

tape('[Common]: genesis hashes tests', function (t) {
  t.test('should generate the genesis state correctly', function (st) {
    vm.stateManager.generateCanonicalGenesis(function () {
      st.equal(vm.trie.root.toString('hex'), genesisData.genesis_state_root)
      st.end()
    })
  })
})
