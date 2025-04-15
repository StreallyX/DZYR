// lib/mock-shop.ts

const mockContents = [
    {
      id: '1',
      title: 'THE PLANE ;)',
      description: 'Catch me if you can ✈️\nMe in the plane\n...\n...\n...',
      price: 20,
      likes: 354,
    },
    {
      id: '2',
      title: 'SECRET BEACH',
      description: 'Hidden spot 🌴\n...',
      price: 25,
      likes: 123,
    },
  ]
  
  let userPurchases: string[] = []
  
  export async function getUserShopContents(username: string) {
    return mockContents // ici on fera appel à Supabase plus tard
  }
  
  export async function getMyPurchases() {
    return userPurchases
  }
  
  export async function mockBuyContent(id: string) {
    userPurchases.push(id)
  }
  