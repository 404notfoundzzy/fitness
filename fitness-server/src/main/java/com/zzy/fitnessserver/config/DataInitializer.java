package com.zzy.fitnessserver.config;

import com.zzy.fitnessserver.entity.*;
import com.zzy.fitnessserver.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import java.math.BigDecimal;

/**
 * 数据初始化配置类，用于在项目启动时初始化演示数据
 */
@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserService userService;
    private final ExerciseService exerciseService;
    private final WorkoutRecordService workoutRecordService;
    private final WeightRecordService weightRecordService;
    private final DailyStatsService dailyStatsService;
    private final SysDictTypeService dictTypeService;
    private final SysDictDataService dictDataService;

    @Override
    public void run(String... args) {
        // 0. 初始化字典数据
        initDictData();

        // 1. 初始化用户
        if (userService.count() == 0) {
            User user = User.builder()
                    .username("admin")
                    .password("123456")
                    .realname("张三")
                    .nickname("健身达人")
                    .phone("13800138000")
                    .avatar("fas fa-user-tie")
                    .status("0")
                    .delFlag("0")
                    .membershipStatus("PRO 会员")
                    .streakDays(128)
                    .totalWorkouts(24)
                    .totalEnergy(12000.0)
                    .totalMedals(85)
                    .build();
            userService.save(user);
        }

        // 2. 初始化练习知识库
        if (exerciseService.count() == 0) {
            exerciseService.saveBatch(Arrays.asList(
                    // 胸部肌群
                    Exercise.builder()
                            .name("杠铃卧推")
                            .category("胸部肌群")
                            .categoryType("chest_muscles")
                            .muscleGroup("胸大肌")
                            .description("躺在平凳上，双脚分开踩实。握距略宽于肩，将杠铃控制下放至乳头位置，触胸后迅速推起，全程保持背部微拱。")
                            .professionalTips("切忌借力弹胸，这会严重损害胸骨。保持手腕垂直，避免在大重量下出现“翻手腕”现象。")
                            .build(),
                    Exercise.builder()
                            .name("哑铃飞鸟")
                            .category("胸部肌群")
                            .categoryType("chest_muscles")
                            .muscleGroup("胸大肌")
                            .description("仰卧在平凳上，双手持哑铃，手臂微屈。以肩为轴呈弧线向下扩展，感受胸部深度拉伸，随后夹胸收回。")
                            .professionalTips("整个过程手臂角度保持不变，想象是在拥抱一棵大树。")
                            .build(),
                    Exercise.builder()
                            .name("俯卧撑")
                            .category("胸部肌群")
                            .categoryType("chest_muscles")
                            .muscleGroup("胸大肌/肱三头肌")
                            .description("双手略宽于肩支撑地面，身体呈直线。核心收紧，缓慢下压至胸部接近地面，随后爆发力推起。")
                            .professionalTips("不要塌腰或翘屁股，肘部与身体呈45度角为宜。")
                            .build(),

                    // 背部肌群
                    Exercise.builder()
                            .name("引体向上")
                            .category("背部肌群")
                            .categoryType("back_muscles")
                            .muscleGroup("背阔肌")
                            .description("双手宽握单杠，身体悬垂。发力向上拉至下巴超过单杠，随后有控制地缓慢下放。")
                            .professionalTips("想象用肘部去撞击身体两侧，而不是单纯用手臂拉。")
                            .build(),
                    Exercise.builder()
                            .name("杠铃划船")
                            .category("背部肌群")
                            .categoryType("back_muscles")
                            .muscleGroup("背阔肌/斜方肌")
                            .description("双脚与肩同宽，膝盖微屈，身体前倾约45度，背部挺直。双手握杠铃拉向腹部，感受背部肌肉挤压。")
                            .professionalTips("保持核心收紧以保护腰椎，动作过程中躯干不要剧烈晃动。")
                            .build(),
                    Exercise.builder()
                            .name("高位下拉")
                            .category("背部肌群")
                            .categoryType("back_muscles")
                            .muscleGroup("背阔肌")
                            .description("坐在器械上，双手宽握横杆。挺胸沉肩，将横杆下拉至上胸部锁骨位置，控制回放。")
                            .professionalTips("不要过度后仰借力，感受肩胛骨的收拢与展开。")
                            .build(),

                    // 下肢肌群
                    Exercise.builder()
                            .name("杠铃深蹲")
                            .category("下肢肌群")
                            .categoryType("leg_muscles")
                            .muscleGroup("股四头肌/臀大肌")
                            .description("双脚与肩同宽，杠铃置于斜方肌上。挺胸收腹，下蹲至大腿与地面平行或略低，保持核心收紧，背部挺直。")
                            .professionalTips("膝盖不要过度内扣，重心始终保持在足中，脚跟不要离地。")
                            .build(),
                    Exercise.builder()
                            .name("硬拉")
                            .category("下肢肌群")
                            .categoryType("leg_muscles")
                            .muscleGroup("腘绳肌/竖脊肌")
                            .description("双脚与肩同宽，杠铃贴近胫骨。背部挺直，挺胸抬头，利用腿部和背部力量将杠铃提起至身体直立。")
                            .professionalTips("严禁圆背动作，这会极大增加腰椎风险。杠铃轨迹应尽可能贴近身体。")
                            .build(),
                    Exercise.builder()
                            .name("箭步蹲")
                            .category("下肢肌群")
                            .categoryType("leg_muscles")
                            .muscleGroup("股四头肌/臀大肌")
                            .description("站立位，一脚向前迈出一大步，同时下蹲至双腿膝盖均呈约90度角。交替进行。")
                            .professionalTips("上半身保持垂直，核心收紧，后脚膝盖不要重磕地面。")
                            .build(),

                    // 肩部肌群
                    Exercise.builder()
                            .name("杠铃推举")
                            .category("肩部肌群")
                            .categoryType("shoulder_muscles")
                            .muscleGroup("三角肌前/中束")
                            .description("站立或坐姿，双手略宽于肩。将杠铃从上胸部垂直推向头顶上方，直至手臂伸直。")
                            .professionalTips("推至顶部时不要完全锁死肘关节，保持肩部张力。")
                            .build(),
                    Exercise.builder()
                            .name("哑铃侧平举")
                            .category("肩部肌群")
                            .categoryType("shoulder_muscles")
                            .muscleGroup("三角肌中束")
                            .description("双手握哑铃垂于体侧，双臂微屈。向身体两侧抬起哑铃至与肩同高，小拇指端略微上翘。")
                            .professionalTips("不要通过身体晃动借力，控制下放过程，感受肩部灼烧感。")
                            .build(),

                    // 手臂肌群
                    Exercise.builder()
                            .name("杠铃弯举")
                            .category("手臂肌群")
                            .categoryType("arm_muscles")
                            .muscleGroup("肱二头肌")
                            .description("站立，双手握杠铃，掌心向上。保持大臂固定在身体两侧，屈肘将杠铃弯举至胸前。")
                            .professionalTips("避免身体前后摇晃借力，下放至底部时不要完全放松张力。")
                            .build(),
                    Exercise.builder()
                            .name("双杠臂屈伸")
                            .category("手臂肌群")
                            .categoryType("arm_muscles")
                            .muscleGroup("肱三头肌/胸大肌下缘")
                            .description("双手撑在双杠上，身体略微前倾。屈肘下沉身体至上臂与地面平行，随后发力推起。")
                            .professionalTips("身体越前倾对胸部刺激越大，越垂直对肱三头肌刺激越大。")
                            .build(),

                    // 核心/腹部
                    Exercise.builder()
                            .name("平板支撑")
                            .category("核心训练")
                            .categoryType("core_training")
                            .muscleGroup("腹横肌/核心群")
                            .description("双肘支撑地面，双脚并拢。身体呈一条直线，收腹、提臀、夹腿，保持静止。")
                            .professionalTips("不要塌腰或抬头，保持均匀呼吸，不要憋气。")
                            .build(),
                    Exercise.builder()
                            .name("卷腹")
                            .category("核心训练")
                            .categoryType("core_training")
                            .muscleGroup("腹直肌")
                            .description("仰卧，双腿弯曲踩实地面。利用腹部力量带动上半身抬起，背部中下部始终贴地，感受腹肌挤压。")
                            .professionalTips("双手不要抱头生拉硬拽，可交叉置于胸前或贴于耳侧。")
                            .build(),

                    // 有氧/全身性
                    Exercise.builder()
                            .name("波比跳")
                            .category("全身有氧")
                            .categoryType("full_body_cardio")
                            .muscleGroup("全身肌群")
                            .description("深蹲-俯卧撑-收腿-跳跃的连贯动作。极高强度的全身性训练动作。")
                            .professionalTips("动作要连贯，保持节奏。初学者可去掉俯卧撑环节。")
                            .build(),
                    Exercise.builder()
                            .name("开合跳")
                            .category("全身有氧")
                            .categoryType("full_body_cardio")
                            .muscleGroup("全身肌群")
                            .description("站立位跳跃，同时双手在头顶击掌，双脚分开。落地时再次跳跃恢复原状。")
                            .professionalTips("落地要轻盈，利用前脚掌缓冲，膝盖保持微屈保护关节。")
                             .build(),

                     // ========== 胸部肌群补充（5个） ==========
                    Exercise.builder().name("上斜哑铃卧推").category("胸部肌群").categoryType("chest_muscles").muscleGroup("胸大肌上部").description("躺在30-45度倾斜的凳子上，双手持哑铃。将哑铃从胸部上方推起至手臂伸直，感受上胸收缩。").professionalTips("凳子角度不宜过大，否则会过度转移到肩部。下放时哑铃应位于锁骨下方位置。").build(),
                    Exercise.builder().name("下斜杠铃卧推").category("胸部肌群").categoryType("chest_muscles").muscleGroup("胸大肌下部").description("头低脚高躺在下斜凳（15-30度），握距略宽于肩。将杠铃推起至锁骨正上方，下放时触胸。").professionalTips("注意头部充血感，如有不适应立即停止或减小角度。适合打造胸肌下沿线条。").build(),
                    Exercise.builder().name("器械夹胸").category("胸部肌群").categoryType("chest_muscles").muscleGroup("胸大肌").description("坐在蝴蝶机/夹胸机上，双手握住把手。肘部微屈，向内收拢把手直至两手几乎相触，感受胸肌挤压。").professionalTips("可以在收拢末端保持1-2秒顶峰收缩。不要用手臂发力推，而是用胸部带动。").build(),
                    Exercise.builder().name("绳索夹胸（高位到低位）").category("胸部肌群").categoryType("chest_muscles").muscleGroup("胸大肌").description("站在龙门架中间，双手握住高位滑轮绳索。身体微微前倾，双臂向下并向内交叉，感受胸肌深度收缩。").professionalTips("可以尝试不同高度组合：高位刺激下胸，低位刺激上胸，中位刺激中缝。").build(),
                    Exercise.builder().name("双杠臂屈伸（胸版）").category("胸部肌群").categoryType("chest_muscles").muscleGroup("胸大肌下缘/肱三头肌").description("双手撑在双杠上，身体前倾约30度。屈肘下沉至上臂与地面平行，利用胸肌发力推起。").professionalTips("身体前倾角度越大，对胸部刺激越强。可在腰部负重增加难度。").build(),

                    // ========== 背部肌群补充（7个） ==========
                    Exercise.builder().name("反手引体向上").category("背部肌群").categoryType("back_muscles").muscleGroup("背阔肌下部/肱二头肌").description("双手反握单杠（掌心朝向自己），握距与肩同宽。发力拉起至下巴超过杠，缓慢下放。").professionalTips("相比正手引体，反手对肱二头肌刺激更强，适合作为背部训练的辅助动作。").build(),
                    Exercise.builder().name("单臂哑铃划船").category("背部肌群").categoryType("back_muscles").muscleGroup("背阔肌/菱形肌").description("一手和一膝支撑在平凳上，另一手持哑铃。背部挺直，将哑铃拉向髋部方向，感受背阔肌收缩。").professionalTips("可以稍微旋转躯干以获得更大的收缩幅度。每侧完成后换边，确保两侧平衡发展。").build(),
                    Exercise.builder().name("T杠划船").category("背部肌群").categoryType("back_muscles").muscleGroup("背阔肌中部").description("站在T杠一端，双手握住横杆两端。保持背部挺直，将T杠拉向胸部，感受背阔肌中部收缩。").professionalTips("T杠的独特轨迹能更好地刺激背阔肌中部。可以使用V型把手增加活动范围。").build(),
                    Exercise.builder().name("直臂下压").category("背部肌群").categoryType("back_muscles").muscleGroup("背阔肌").description("站立位，双手握住高位绳索（直杆或绳索）。保持手臂微屈但固定不动，将绳索压向大腿前方，感受背阔肌拉伸与收缩。").professionalTips("这是少数能孤立刺激背阔肌的动作。手臂角度全程保持不变，不要弯曲肘部借力。").build(),
                    Exercise.builder().name("坐姿绳索划船").category("背部肌群").categoryType("back_muscles").muscleGroup("背阔肌/菱形肌/斜方肌").description("坐在划船机上，双脚踩住踏板，双手握住把手。身体直立，将把手拉向腹部，肩胛骨后收。").professionalTips("拉起时挺胸，不要弓背。可以在末端保持1-2秒以增强肌肉收缩感。").build(),
                    Exercise.builder().name("面拉").category("背部肌群").categoryType("back_muscles").muscleGroup("三角肌后束/菱形肌/rotator cuff").description("站在龙门架前，双手握住绳索（高位设置）。将绳索拉向面部高度，同时向外展开手肘，感受后肩和上背收缩。").professionalTips("改善圆肩驼背的神器动作。专注于外旋肩关节的感觉，而不是单纯向后拉。").build(),
                    Exercise.builder().name("传统硬拉").category("背部肌群/下肢肌群").categoryType("back_muscles").muscleGroup("竖脊肌/腘绳肌/臀大肌").description("双脚与髋同宽，杠铃贴近胫骨。屈髋屈膝握住杠铃，背部挺直。通过伸展髋部和膝盖将杠铃提起至身体直立。").professionalTips("严禁圆背！杠铃轨迹应始终贴近身体。启动时先伸髋再伸膝，保持重心在足中。").build(),

                    // ========== 下肢肌群补充（9个） ==========
                    Exercise.builder().name("腿举（倒蹬机）").category("下肢肌群").categoryType("leg_muscles").muscleGroup("股四头肌/臀大肌").description("坐在腿举机上，背部贴紧靠垫，双脚踩在踏板上（位置可调整）。通过伸膝将踏板推起，缓慢下放。").professionalTips("脚位越高越侧重臀部和腘绳肌，越低越侧重股四头肌。不要完全锁死膝关节。").build(),
                    Exercise.builder().name("腿弯举（俯卧）").category("下肢肌群").categoryType("leg_muscles").muscleGroup("腘绳肌").description("俯卧在腿弯举机上，脚跟勾住滚垫。保持骨盆贴紧垫子，屈膝将滚垫拉向臀部，感受腘绳肌收缩。").professionalTips("不要抬起臀部借力。可以在收缩顶端停留1-2秒增强刺激。是预防大腿后侧拉伤的重要辅助动作。").build(),
                    Exercise.builder().name("腿屈伸（坐姿）").category("下肢肌群").categoryType("leg_muscles").muscleGroup("股四头肌").description("坐在腿屈伸机上，背部贴紧靠垫，脚背勾住滚垫。伸膝将滚垫抬起至双腿几乎伸直，缓慢下放。").professionalTips("适合作为深蹲前的预热动作或练后补充刺激。不要猛烈甩动，控制离心阶段。").build(),
                    Exercise.builder().name("罗马尼亚硬拉（RDL）").category("下肢肌群").categoryType("leg_muscles").muscleGroup("腘绳肌/臀大肌").description("双脚与髋同宽，手持杠铃。保持膝盖微屈固定不动，屈髋将杠铃沿腿部下放，感受大腿后侧拉伸，然后伸髋拉起。").professionalTips("与传统硬拉不同，RDL强调的是髋关节铰链运动而非膝关节。下放深度以个人柔韧性为准，不必触碰地面。").build(),
                    Exercise.builder().name("臀桥/臀推").category("下肢肌群").categoryType("leg_muscles").muscleGroup("臀大肌/腘绳肌").description("仰卧在地面上，双脚屈膝踩实，双臂放在身体两侧。通过收缩臀部将髋部推起至身体呈一直线，顶峰收缩后缓慢下放。").professionalTips("在最高点应有意识地收缩臀部1-2秒。可在髋部放置杠铃片增加负荷。这是塑造臀部的王牌动作。").build(),
                    Exercise.builder().name("保加利亚分腿蹲").category("下肢肌群").categoryType("leg_muscles").muscleGroup("股四头肌/臀大肌").description("一只脚的脚背搭在后方平凳上，另一只脚向前站立。下蹲至前腿大腿平行地面，后膝接近地面，然后站起。").professionalTips("对平衡能力要求较高，初期可不持重量。这个动作能很好地纠正左右腿力量不平衡问题。").build(),
                    Exercise.builder().name("哈克深蹲").category("下肢肌群").categoryType("leg_muscles").muscleGroup("股四头肌/臀大肌").description("站在哈克深蹲机内，背部靠在靠垫上，肩膀抵住肩垫。通过下蹲和伸膝完成动作，机器引导运动轨迹。").professionalTips("脚的位置影响目标肌群：脚位越高越偏臀部，越低越偏股四头肌。比自由重量深蹲更安全，适合大重量训练。").build(),
                    Exercise.builder().name("提踵（站立/坐姿）").category("下肢肌群").categoryType("leg_muscles").muscleGroup("腓肠肌/比目鱼肌").description("站立或坐姿，前脚掌踩在边缘平台上。通过伸展踝关节将脚跟尽可能抬高，感受小腿肌肉充分收缩后缓慢下放。").professionalTips("站立提踵主要刺激腓肠肌（显眼的小腿肚），坐姿提踵更多刺激比目鱼肌（深层肌肉）。全程保持幅度最大化。").build(),
                    Exercise.builder().name("相扑硬拉").category("下肢肌群").categoryType("leg_muscles").muscleGroup("内收肌/臀大肌/腘绳肌").description("双脚宽距站立（约1.5倍肩宽），脚尖大幅外展。双手在双腿间握住杠铃（窄握或中握），屈髋屈膝将杠铃拉起。").professionalTips("相比传统硬拉，相扑硬拉对内收肌和臀部刺激更强，行程更短，适合大重量训练。").build(),

                    // ========== 肩部肌群补充（6个） ==========
                    Exercise.builder().name("哑铃前平举").category("肩部肌群").categoryType("shoulder_muscles").muscleGroup("三角肌前束").description("双手持哑铃垂于大腿前方，手掌朝向身体。将哑铃向前上方抬起至与肩同高，缓慢下放。").professionalTips("可以交替进行（左手-右手）或双手同时。前平举容易借力，务必保持身体稳定。").build(),
                    Exercise.builder().name("俯身哑铃飞鸟").category("肩部肌群").categoryType("shoulder_muscles").muscleGroup("三角肌后束").description("双脚分开站立，上半身前倾约90度（或胸口支撑在斜凳上），背部挺直。双手持哑铃向两侧展开，感受后肩收缩。").professionalTips("后束常被忽视但对肩部健康至关重要。手臂微屈固定，不要用背部发力。").build(),
                    Exercise.builder().name("阿诺德推举").category("肩部肌群").categoryType("shoulder_muscles").muscleGroup("三角肌前/中/后束").description("坐姿，双手持哑铃于肩部高度，掌心朝向自己。向上推举的同时旋转手腕使掌心朝外，手臂伸直后再反向旋转下放。").professionalTips("由阿诺德·施瓦辛格推广，能在一次动作中全面刺激三角肌三个束。重量不宜过大，注重控制。").build(),
                    Exercise.builder().name("绳索面拉").category("肩部肌群").categoryType("shoulder_muscles").muscleGroup("三角肌后束/菱形肌").description("站在龙门架前，双手握住绳索（高位设置）。将绳索拉向面部高度，同时向外展开手肘，仿佛要将绳子拉开。").professionalTips("改善体态、预防肩部损伤的关键动作。专注于肩关节外旋的感觉，而不是单纯的拉力。").build(),
                    Exercise.builder().name("杠铃耸肩").category("肩部肌群").categoryType("shoulder_muscles").muscleGroup("斜方肌上部").description("双手持杠铃（或哑铃）垂于体侧，保持手臂伸直。通过收缩斜方肌将肩膀向上耸起，在最高点保持1-2秒后缓慢下放。").professionalTips("不要滚动肩膀（绕圈运动），而是纯粹的上下运动。可以采用大重量低次数的训练方式（如6-8次）。").build(),
                    Exercise.builder().name("绳索反向飞鸟").category("肩部肌群").categoryType("shoulder_muscles").muscleGroup("三角肌后束").description("站在龙门架中间，双手交叉握住对侧低位滑轮绳索。身体微前倾，双手向两侧拉开，感受后肩收缩。").professionalTips("相比哑铃俯身飞鸟，绳索版本能提供持续的张力，特别是在收缩末端。适合作为后束训练的主项。").build(),

                    // ========== 手臂肌群补充（8个） ==========
                    Exercise.builder().name("哑铃交替弯举").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱二头肌").description("双手各持一个哑铃垂于体侧。交替进行弯举动作，一侧弯举时另一侧保持稳定。可以在弯举过程中旋转手腕（supination）。").professionalTips("旋转手腕（从小指侧转向拇指侧）能最大化刺激肱二头肌的旋后功能。专注于一侧时避免另一侧晃动。").build(),
                    Exercise.builder().name("锤式弯举").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱肌/肱桡肌").description("双手持哑铃垂于体侧，掌心相对（中立握）。保持大臂固定，屈肘将哑铃向上弯举，全程保持掌心相对。").professionalTips("锤式弯举主要刺激肱肌（位于肱二头肌下方），能让手臂从侧面看起来更厚实。对前臂也有良好刺激。").build(),
                    Exercise.builder().name("集中弯举").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱二头肌（肌峰）").description("坐姿，一手持哑铃，同侧肘部支撑在同侧大腿内侧。保持大臂固定，仅通过屈肘将哑铃弯起，充分收缩肱二头肌。").professionalTips("经典的塑形动作，特别适合打造肱二头肌肌峰（peak）。使用中等重量，注重肌肉收缩感和峰值收缩。").build(),
                    Exercise.builder().name("绳索弯举").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱二头肌").description("站在龙门架前，双手握住低位绳索附件（直杆或V型杆）。保持大臂固定，屈肘将绳索向上弯举。").professionalTips("绳索的优势在于提供持续的张力，特别是在动作底端（自由重量在此处张力最小）。V型杆对手腕更友好。").build(),
                    Exercise.builder().name("窄距卧推（钻石俯卧撑）").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱三头肌").description("双手撑地（或握杠铃），间距小于肩宽（卧推）或双手组成钻石形状（俯卧撑）。通过伸肘将重量推起。").professionalTips("窄距会显著增加肘关节压力，建议做好热身。钻石俯卧撑可作为自重训练的优秀选择。").build(),
                    Exercise.builder().name("绳索下压").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱三头肌").description("站在龙门架前，双手握住高位绳索（直杆、V型杆或绳索）。保持大臂固定在身体两侧，伸肘将绳索向下压至手臂伸直。").professionalTips("最经典的三头肌训练动作之一。避免用身体重量下压借力，专注于三头肌的收缩。可以尝试不同的握法变化。").build(),
                    Exercise.builder().name("过头臂屈伸").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱三头肌长头").description("坐姿或站姿，双手持哑铃（或杠铃EZ杆）举过头顶。保持上臂固定靠近耳朵，屈肘将重量下放至颈后，再伸肘举起。").professionalTips("长头是三头肌中唯一跨越双关节的头，过头臂屈伸能将其充分拉伸。注意选择可控的重量，保护肘关节。").build(),
                    Exercise.builder().name("仰卧臂屈伸（Skull Crushers）").category("手臂肌群").categoryType("arm_muscles").muscleGroup("肱三头肌").description("仰卧在平凳上，双手握住EZ杆（或直杆/哑铃），手臂伸直指向天花板。保持上臂固定，屈肘将杠铃下放至额头附近，再伸肘推起。").professionalTips("又名「碎颅者」，因为动作看起来像要用杠铃砸自己的头。使用EZ杆以减轻手腕压力。下放不要太低以免砸到头。").build(),

                    // ========== 核心训练补充（8个） ==========
                    Exercise.builder().name("反向卷腹").category("核心训练").categoryType("core_training").muscleGroup("腹直肌（下腹部）").description("仰卧，双腿伸直向上抬起（垂直地面或略后倾）。保持双腿微屈，利用下腹力量将臀部抬离地面，将脚跟推向天花板方向。").professionalTips("下腹是最难练的部位之一。动作幅度不需要很大，关键是感受到下腹的收缩。避免利用惯性摆动双腿。").build(),
                    Exercise.builder().name("俄罗斯转体").category("核心训练").categoryType("core_training").muscleGroup("腹内外斜肌").description("坐姿，双腿屈膝抬起（双脚可离地或轻触地），身体后倾约45度。双手合十或持重物，向左右两侧旋转躯干。").professionalTips("转动时眼睛跟随手的方向，确保躯干真正发生旋转而不是只是手臂摆动。可以增加负重（药球/哑铃）提高难度。").build(),
                    Exercise.builder().name("悬垂举腿").category("核心训练").categoryType("core_training").muscleGroup("腹直肌/髂腰肌").description("悬挂在单杠上（正握或反握），双腿并拢伸直。利用腹肌力量将双腿抬起至与地面平行或更高，缓慢下放。").professionalTips("高级核心动作，对上肢力量和核心稳定性要求较高。初学者可采用屈膝版本降低难度。摆动会降低效果，尽量保持身体稳定。").build(),
                    Exercise.builder().name("死虫式（Dead Bug）").category("核心训练").categoryType("core_training").muscleGroup("腹横肌/核心稳定肌群").description("仰卧，双臂伸直指向天花板，双腿屈膝90度抬起（小腿平行地面）。同时将对侧的手臂和腿向两端延伸（右手+左腿），回到起始后换侧。").professionalTips("核心要点：下背部必须始终贴紧地面！如果腰部拱起就减小动作幅度。这是一个极好的核心激活和协调性训练。").build(),
                    Exercise.builder().name("鸟狗式（Bird-Dog）").category("核心训练").categoryType("core_training").muscleGroup("核心稳定肌群/竖脊肌").description("四肢着地（手在肩下，膝在髋下）。同时伸出对侧的手臂和腿（右手+左腿），保持身体平衡和脊柱中立，短暂保持后回到起始位置。").professionalTips("不要追求抬得过高，保持脊柱笔直才是关键。这个动作能很好地改善核心稳定性和脊柱健康，特别适合作为热身环节。").build(),
                    Exercise.builder().name("自行车卷腹（Bicycle Crunch）").category("核心训练").categoryType("core_training").muscleGroup("腹直肌/腹斜肌").description("仰卧，双手轻贴耳侧。一侧肩胛骨离地向对侧膝盖方向旋转卷腹，同时对侧腿伸直（但不触地），模拟骑自行车的动作。").professionalTips("被多项研究评为最有效的腹肌训练动作之一。关键在于旋转幅度要足够大，让肘部真正接近膝盖。保持节奏连贯。").build(),
                    Exercise.builder().name("侧支撑（Side Plank）").category("核心训练").categoryType("core_training").muscleGroup("腹内外斜肌/臀中肌").description("侧身用单肘支撑地面（肘部在肩膀正下方），双腿并拢伸直。将髋部推起，使身体从头到脚呈一条直线，保持静止。").professionalTips("可以简化为膝盖支撑的版本。确保髋部不下沉也不上顶。侧支撑对改善腰部线条和稳定骨盆非常有效。").build(),
                    Exercise.builder().name("V字支撑（V-Sit Hold）").category("核心训练").categoryType("core_training").muscleGroup("腹直肌/髂腰肌").description("坐姿，身体后倾同时双腿抬起伸直，形成「V」字形。双手可前伸维持平衡，保持该姿势静止。").professionalTips("进阶版的静态核心训练动作。如果无法保持双腿伸直，可以先采用屈膝版本。目标是保持20-60秒。").build(),

                    // ========== 全身有氧补充（10个） ==========
                    Exercise.builder().name("登山跑（Mountain Climbers）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("核心/肩部/心肺系统").description("双手撑地呈俯卧撑姿势，身体呈直线。快速交替将膝盖向胸部拉近，模拟登山的跑步动作。").professionalTips("核心要保持稳定，不要让臀部随着动作上下起伏太明显。速度越快强度越高，但也更容易牺牲动作质量。").build(),
                    Exercise.builder().name("高抬腿（High Knees）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("髋屈肌/核心/心肺系统").description("站立位，原地快速交替抬起膝盖，尽量使膝盖达到髋部高度。配合摆臂保持节奏和平衡。").professionalTips("优秀的激活和热身动作。注意用前脚掌落地，上身保持正直不要后仰。可以结合向前移动增加难度。").build(),
                    Exercise.builder().name("跳绳（Jump Rope）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("小腿/心肺系统/协调性").description("双手握跳绳手柄，绳子置于身后。甩动绳子从脚下穿过，在其落地前跃起让绳子通过，连续循环。").professionalTips("高效燃脂的有氧运动，10分钟跳绳≈30分钟慢跑。保持轻盈落地，用手腕发力甩绳而非整个手臂。可尝试双摇、交叉跳等花式。").build(),
                    Exercise.builder().name("壶铃摇摆（Kettlebell Swing）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("臀链（臀大肌/腘绳肌）/肩部/核心").description("双脚宽于肩站立，双手握住壶铃置于两腿之间。保持背部挺直，爆发性地伸髋将壶铃向前摆起至肩部高度，利用惯性回摆重复。").professionalTips("这不是一个深蹲和提拉动作，而是一个髋关节铰链（hinge）动作！动力来自臀部的爆发性伸展，而不是手臂上提。").build(),
                    Exercise.builder().name("战绳（Battle Ropes）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("全身肌群/心肺系统").description("双手各握一根战绳的一端，半蹲站位。通过交替或同时上下挥动绳子制造波浪，持续进行30-60秒为一组。").professionalTips("极佳的无冲击有氧训练，对关节友好。波浪越大强度越高。常见的模式包括：交替波、同步波、蛇形波等。").build(),
                    Exercise.builder().name("箱式跳跃（Box Jump）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("下肢爆发力/核心").description("站在稳固的箱子或平台前（高度适中）。快速下蹲后爆发性垂直跳上箱子，双脚同时平稳落地（轻声），然后走下或跳下。").professionalTips("发展爆发力的经典动作。落地时屈膝缓冲，发出声音越小说明技术越好。箱子高度应根据能力渐进增加。").build(),
                    Exercise.builder().name("药球砸掷（Slam Ball）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("全身爆发力/核心").description("双脚与肩同宽站立，双手持药球举过头顶。用力将球砸向地面（正下方或稍前方），接住反弹（或不弹球）后重复。").professionalTips("使用不会反弹的专用slam ball更安全。砸球时伴随一声有力的呼气，感受核心和上背的参与。").build(),
                    Exercise.builder().name("农夫行走（Farmer's Walk）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("全身/握力/核心稳定").description("双手各持一个重物（哑铃/壶铃/六角杠），身体直立，核心收紧。挺胸抬头直线行走一定距离或时间。").professionalTips("看似简单实则极具挑战性的全身性训练。能显著提升握力、核心稳定性和整体工作能力（GPP）。保持步伐稳健，不要匆忙。").build(),
                    Exercise.builder().name("雪橇推/拉（Sled Push/Pull）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("全身肌群/心肺系统").description("双手扶住负重雪橇（prowler sled）的手柄，身体前倾，通过双腿驱动推动雪橇前进。也可以使用绳索拉动。").professionalTips("极佳的无冲击高强度有氧方式，对关节友好且能产生巨大的代谢需求。推时偏下肢和胸，拉时偏背部和臂。").build(),
                    Exercise.builder().name("熊爬（Bear Crawl）").category("全身有氧").categoryType("full_body_cardio").muscleGroup("核心稳定/肩部/协调性").description("四肢着地（手在肩下，膝盖离地约5厘米），臀部与肩同高。同时移动对侧的手和脚（右手+左脚）向前爬行，保持背部平坦。").professionalTips("优秀的核心稳定性和协调性训练。看起来简单但做标准很有挑战。保持低姿态，不要让臀部上下起伏太大。").build()
            ));
        }

        // 3. 初始化体重记录
        if (weightRecordService.count() == 0) {
            LocalDate today = LocalDate.now();
            weightRecordService.saveBatch(Arrays.asList(
                    WeightRecord.builder().userId(1L).weight(BigDecimal.valueOf(75.5)).recordDate(today.minusDays(6)).build(),
                    WeightRecord.builder().userId(1L).weight(BigDecimal.valueOf(75.2)).recordDate(today.minusDays(4)).build(),
                    WeightRecord.builder().userId(1L).weight(BigDecimal.valueOf(74.8)).recordDate(today.minusDays(2)).build(),
                    WeightRecord.builder().userId(1L).weight(BigDecimal.valueOf(74.3)).recordDate(today).build()));
        }

        // 4. 初始化每日数据
        if (dailyStatsService.count() == 0) {
            LocalDate today = LocalDate.now();
            dailyStatsService.saveBatch(Arrays.asList(
                    DailyStats.builder().userId(1L).date(today.minusDays(6)).caloriesBurned(800).steps(5000)
                            .activityDurationMinutes(40).build(),
                    DailyStats.builder().userId(1L).date(today.minusDays(5)).caloriesBurned(1200).steps(8000)
                            .activityDurationMinutes(60).build(),
                    DailyStats.builder().userId(1L).date(today.minusDays(4)).caloriesBurned(1500).steps(12000)
                            .activityDurationMinutes(90).build(),
                    DailyStats.builder().userId(1L).date(today.minusDays(3)).caloriesBurned(900).steps(6000)
                            .activityDurationMinutes(50).build(),
                    DailyStats.builder().userId(1L).date(today.minusDays(2)).caloriesBurned(1100).steps(7000)
                            .activityDurationMinutes(70).build(),
                    DailyStats.builder().userId(1L).date(today.minusDays(1)).caloriesBurned(600).steps(4000)
                            .activityDurationMinutes(30).build(),
                    DailyStats.builder().userId(1L).date(today).caloriesBurned(1240).steps(8432)
                            .activityDurationMinutes(85).build()));
        }

        // 5. 初始化运动记录
        if (workoutRecordService.count() == 0) {
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.HOUR, -24);
            Date startTime = cal.getTime();
            
            cal = Calendar.getInstance();
            cal.add(Calendar.HOUR, -23);
            cal.add(Calendar.MINUTE, -15);
            Date endTime = cal.getTime();
            
            workoutRecordService.save(WorkoutRecord.builder()
                    .userId(1L)
                    .name("力量训练：胸背")
                    .startTime(startTime)
                    .endTime(endTime)
                    .durationMinutes(45)
                    .volume(new BigDecimal("2400"))
                    .exerciseCount(5)
                    .status("已同步")
                    .build());
        }
    }

    private void initDictData() {
        // 1. 健身类型字典类型
        if (dictTypeService.count() == 0) {
            SysDictType fitnessType = SysDictType.builder()
                    .dictName("健身类型")
                    .dictType("fitness_type")
                    .status("0")
                    .createBy("admin")
                    .createTime(new Date())
                    .remark("健身训练分类")
                    .build();
            dictTypeService.save(fitnessType);

            // 2. 健身类型字典数据
            List<SysDictData> dictDataList = Arrays.asList(
                    SysDictData.builder().dictSort(1).dictLabel("跑步").dictValue("running").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(2).dictLabel("力量训练").dictValue("strength").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(3).dictLabel("瑜伽").dictValue("yoga").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(4).dictLabel("骑行").dictValue("cycling").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(5).dictLabel("游泳").dictValue("swimming").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(6).dictLabel("跳绳").dictValue("jump_rope").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(7).dictLabel("HIIT").dictValue("hiit").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(8).dictLabel("步行").dictValue("walking").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(9).dictLabel("拉伸").dictValue("stretching").dictType("fitness_type")
                            .status("0").build(),
                    SysDictData.builder().dictSort(10).dictLabel("椭圆机").dictValue("elliptical").dictType("fitness_type")
                            .status("0").build());
            dictDataService.saveBatch(dictDataList);

            // 3. 健身动作类型字典类型
            SysDictType actionType = SysDictType.builder()
                    .dictName("健身动作类型")
                    .dictType("exercise_category")
                    .status("0")
                    .createBy("admin")
                    .createTime(new Date())
                    .remark("健身动作部位分类")
                    .build();
            dictTypeService.save(actionType);

            // 4. 健身动作类型字典数据
            List<SysDictData> actionDataList = Arrays.asList(
                    SysDictData.builder().dictSort(1).dictLabel("全身有氧").dictValue("full_body_cardio")
                            .dictType("exercise_category").status("0").build(),
                    SysDictData.builder().dictSort(2).dictLabel("核心训练").dictValue("core_training")
                            .dictType("exercise_category").status("0").build(),
                    SysDictData.builder().dictSort(3).dictLabel("手臂肌群").dictValue("arm_muscles")
                            .dictType("exercise_category").status("0").build(),
                    SysDictData.builder().dictSort(4).dictLabel("肩部肌群").dictValue("shoulder_muscles")
                            .dictType("exercise_category").status("0").build(),
                    SysDictData.builder().dictSort(5).dictLabel("下肢肌群").dictValue("leg_muscles")
                            .dictType("exercise_category").status("0").build(),
                    SysDictData.builder().dictSort(6).dictLabel("背部肌群").dictValue("back_muscles")
                            .dictType("exercise_category").status("0").build(),
                    SysDictData.builder().dictSort(7).dictLabel("胸部肌群").dictValue("chest_muscles")
                            .dictType("exercise_category").status("0").build());
            dictDataService.saveBatch(actionDataList);

            // 5. 性别字典类型
            SysDictType genderType = SysDictType.builder()
                    .dictName("性别")
                    .dictType("sys_gender")
                    .status("0")
                    .createBy("admin")
                    .createTime(new Date())
                    .remark("用户性别选择")
                    .build();
            dictTypeService.save(genderType);

            // 6. 性别字典数据
            List<SysDictData> genderDataList = Arrays.asList(
                    SysDictData.builder().dictSort(1).dictLabel("男").dictValue("male")
                            .dictType("sys_gender").isDefault("N").status("0").build(),
                    SysDictData.builder().dictSort(2).dictLabel("女").dictValue("female")
                            .dictType("sys_gender").isDefault("N").status("0").build());
            dictDataService.saveBatch(genderDataList);

            // 7. 健身目标字典类型
            SysDictType goalType = SysDictType.builder()
                    .dictName("健身目标")
                    .dictType("sys_fitness_goal")
                    .status("0")
                    .createBy("admin")
                    .createTime(new Date())
                    .remark("用户健身目标选择")
                    .build();
            dictTypeService.save(goalType);

            // 8. 健身目标字典数据
            List<SysDictData> goalDataList = Arrays.asList(
                    SysDictData.builder().dictSort(1).dictLabel("减脂塑形").dictValue("lose_weight")
                            .dictType("sys_fitness_goal").isDefault("N").status("0").build(),
                    SysDictData.builder().dictSort(2).dictLabel("增肌增重").dictValue("gain_muscle")
                            .dictType("sys_fitness_goal").isDefault("N").status("0").build(),
                    SysDictData.builder().dictSort(3).dictLabel("保持健康").dictValue("maintain")
                            .dictType("sys_fitness_goal").isDefault("Y").status("0").build(),
                    SysDictData.builder().dictSort(4).dictLabel("提升耐力").dictValue("endurance")
                            .dictType("sys_fitness_goal").isDefault("N").status("0").build(),
                    SysDictData.builder().dictSort(5).dictLabel("增强力量").dictValue("strength")
                            .dictType("sys_fitness_goal").isDefault("N").status("0").build(),
                    SysDictData.builder().dictSort(6).dictLabel("提升柔韧性").dictValue("flexibility")
                            .dictType("sys_fitness_goal").isDefault("N").status("0").build());
            dictDataService.saveBatch(goalDataList);
        }
    }
}
