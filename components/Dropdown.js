import React, {useState} from 'react';
import {View, Text, Modal, TouchableOpacity, FlatList, StyleSheet} from 'react-native';

export default function Dropdown({label, options = [], value, onChange}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.control} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{value ? value.name || value : 'Select'}</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id || item}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => { onChange(item); setOpen(false); }}
              >
                <Text style={styles.optText}>{item.name || item}</Text>
                {item.ratePerKg ? <Text style={styles.optSub}>₹{item.ratePerKg}</Text> : null}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.close} onPress={() => setOpen(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginBottom: 12},
  label: {fontSize: 13, marginBottom: 6, color: '#444'},
  control: {height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#fff'},
  value: {color: '#111'},
  modal: {flex:1, padding:16, backgroundColor:'#fff'},
  option: {paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#eee', flexDirection:'row', justifyContent:'space-between'},
  optText: {fontSize:16},
  optSub: {color:'#666'},
  close: {marginTop:12, alignItems:'center'},
  closeText: {color:'#007AFF'},
});
