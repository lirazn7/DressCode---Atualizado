import React from 'react';
import { TouchableOpacity, Image, Text, View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2;

export default function PostCard({ post, onPress, showStats = true, customStyle }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.postCard, customStyle]}>
      <Image source={{ uri: post.imageuri }} style={styles.postImage} />
      
      {showStats && (
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.postOverlay}>
          <Text style={styles.postUsername}>@{post.username || 'usuario'}</Text>
          <View style={styles.miniStatsRow}>
            <MaterialCommunityIcons 
              name="heart" 
              size={12} 
              color={post.isLiked ? "#ed85ff" : "#fff"} 
            />
            <Text style={styles.miniStatText}>{post.totalLikes || 0}</Text>
            
            <MaterialCommunityIcons 
              name="comment" 
              size={12} 
              color="#fff" 
              style={{ marginLeft: 8 }} 
            />
            <Text style={styles.miniStatText}>{post.totalComments || 0}</Text>
          </View>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: { 
    width: COLUMN_WIDTH, 
    height: 280, 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: '#4A1461' 
  },
  postImage: { 
    width: '100%', 
    height: '100%' 
  },
  postOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    padding: 12 
  },
  postUsername: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  miniStatsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4 
  },
  miniStatText: { 
    color: '#fff', 
    fontSize: 10, 
    marginLeft: 3 
  }
});